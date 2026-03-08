import { useEffect, useState, useRef } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MessageCircle, Send, ArrowLeft, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Conversation {
  id: string;
  participant_a: string;
  participant_b: string;
  last_message_at: string;
  partner_name: string;
  partner_id: string;
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export default function Messages() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("to");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const fetchConversations = async () => {
    if (!user) return;
    const { data: convos } = await (supabase as any)
      .from("conversations")
      .select("*")
      .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (!convos || convos.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Get partner profiles
    const partnerIds = convos.map((c: any) =>
      c.participant_a === user.id ? c.participant_b : c.participant_a
    );
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", partnerIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

    // Get unread counts
    const { data: unreadData } = await (supabase as any)
      .from("messages")
      .select("conversation_id")
      .eq("read", false)
      .neq("sender_id", user.id)
      .in("conversation_id", convos.map((c: any) => c.id));

    const unreadMap = new Map<string, number>();
    (unreadData || []).forEach((m: any) => {
      unreadMap.set(m.conversation_id, (unreadMap.get(m.conversation_id) || 0) + 1);
    });

    setConversations(
      convos.map((c: any) => {
        const partnerId = c.participant_a === user.id ? c.participant_b : c.participant_a;
        return {
          ...c,
          partner_id: partnerId,
          partner_name: profileMap.get(partnerId) || "User",
          unread_count: unreadMap.get(c.id) || 0,
        };
      })
    );
    setLoading(false);
  };

  // Auto-create conversation if ?to= param
  useEffect(() => {
    if (!user || !targetUserId || targetUserId === user.id) return;
    const initConvo = async () => {
      // Check existing
      const { data: existing } = await (supabase as any)
        .from("conversations")
        .select("id")
        .or(
          `and(participant_a.eq.${user.id},participant_b.eq.${targetUserId}),and(participant_a.eq.${targetUserId},participant_b.eq.${user.id})`
        )
        .maybeSingle();

      if (existing) {
        setActiveConvo(existing.id);
      } else {
        const { data: newConvo, error } = await (supabase as any)
          .from("conversations")
          .insert({ participant_a: user.id, participant_b: targetUserId })
          .select()
          .single();
        if (!error && newConvo) setActiveConvo(newConvo.id);
      }
      fetchConversations();
    };
    initConvo();
  }, [user, targetUserId]);

  useEffect(() => {
    fetchConversations();
  }, [user]);

  // Fetch messages for active conversation
  useEffect(() => {
    if (!activeConvo) return;
    const fetchMessages = async () => {
      const { data } = await (supabase as any)
        .from("messages")
        .select("*")
        .eq("conversation_id", activeConvo)
        .order("created_at", { ascending: true });
      setMessages(data || []);

      // Mark unread as read
      if (user) {
        await (supabase as any)
          .from("messages")
          .update({ read: true })
          .eq("conversation_id", activeConvo)
          .neq("sender_id", user.id)
          .eq("read", false);
      }
    };
    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`messages-${activeConvo}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConvo}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          // Mark as read if not sender
          if (user && (payload.new as Message).sender_id !== user.id) {
            (supabase as any)
              .from("messages")
              .update({ read: true })
              .eq("id", (payload.new as Message).id);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConvo, user]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConvo || !user) return;
    setSending(true);
    const { error } = await (supabase as any).from("messages").insert({
      conversation_id: activeConvo,
      sender_id: user.id,
      content: newMessage.trim(),
    });
    if (error) toast.error("Failed to send");
    else {
      setNewMessage("");
      // Update last_message_at
      await (supabase as any)
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", activeConvo);
    }
    setSending(false);
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const activeConversation = conversations.find((c) => c.id === activeConvo);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl font-bold mb-6"
        >
          Messages
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-6 md:grid-cols-[300px_1fr] h-[calc(100vh-220px)]"
        >
          {/* Conversation list */}
          <Card className={`overflow-hidden card-elevated border-border/50 ${activeConvo ? "hidden md:block" : ""}`}>
            <CardHeader className="py-3 px-4 border-b border-border/50">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" /> Conversations
              </CardTitle>
            </CardHeader>
            <ScrollArea className="h-[calc(100%-60px)]">
              {loading ? (
                <p className="p-4 text-sm text-muted-foreground">Loading...</p>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground/20 mb-2" />
                  <p className="text-sm text-muted-foreground">No conversations yet.</p>
                </div>
              ) : (
                conversations.map((c, i) => (
                  <motion.button
                    key={c.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setActiveConvo(c.id)}
                    className={`w-full text-left px-4 py-3 border-b border-border/30 transition-colors hover:bg-muted/50 ${
                      activeConvo === c.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium text-sm truncate">{c.partner_name}</span>
                      </div>
                      {c.unread_count > 0 && (
                        <Badge className="gradient-accent text-accent-foreground text-xs h-5 min-w-5 flex items-center justify-center">
                          {c.unread_count}
                        </Badge>
                      )}
                    </div>
                  </motion.button>
                ))
              )}
            </ScrollArea>
          </Card>

          {/* Chat area */}
          <Card className={`flex flex-col overflow-hidden card-elevated border-border/50 ${!activeConvo ? "hidden md:flex" : ""}`}>
            {activeConvo ? (
              <>
                <CardHeader className="py-3 px-4 border-b border-border/50 flex-row items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8"
                    onClick={() => setActiveConvo(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-sm">{activeConversation?.partner_name || "Chat"}</CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    <AnimatePresence>
                      {messages.map((m) => (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className={`flex ${m.sender_id === user.id ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                              m.sender_id === user.id
                                ? "gradient-primary text-primary-foreground rounded-br-md"
                                : "bg-muted text-foreground rounded-bl-md"
                            }`}
                          >
                            <p>{m.content}</p>
                            <p className={`text-[10px] mt-1 ${m.sender_id === user.id ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                              {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>
                <div className="border-t border-border/50 p-3 flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    maxLength={1000}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    className="bg-muted/50"
                  />
                  <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} size="icon" className="gradient-primary text-primary-foreground">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/20 mb-3" />
                  <p className="font-medium">Select a conversation to start chatting</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Your messages are end-to-end private</p>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
