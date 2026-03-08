import { useEffect, useState, useRef, useCallback } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { MessageCircle, Send, Smile } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConversationList, type Conversation } from "@/components/messaging/ConversationList";
import { MessageBubble, type Message } from "@/components/messaging/MessageBubble";
import { ChatHeader } from "@/components/messaging/ChatHeader";
import { TypingIndicator } from "@/components/messaging/TypingIndicator";
import { DateSeparator } from "@/components/messaging/DateSeparator";
import { format } from "date-fns";

export default function Messages() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("to");
  const contextType = searchParams.get("context_type");
  const contextId = searchParams.get("context_id");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Update last_seen_at periodically
  useEffect(() => {
    if (!user) return;
    const update = () => {
      supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("user_id", user.id).then(() => {});
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
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

    const partnerIds = convos.map((c: any) =>
      c.participant_a === user.id ? c.participant_b : c.participant_a
    );

    // Fetch profiles, unread counts, and last messages in parallel
    const [profilesRes, unreadRes, lastMsgRes, contextRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, avatar_url, last_seen_at").in("user_id", partnerIds),
      (supabase as any).from("messages").select("conversation_id").eq("read", false).neq("sender_id", user.id).in("conversation_id", convos.map((c: any) => c.id)),
      Promise.all(convos.map((c: any) =>
        (supabase as any).from("messages").select("content").eq("conversation_id", c.id).order("created_at", { ascending: false }).limit(1).then((r: any) => ({ id: c.id, content: r.data?.[0]?.content }))
      )),
      // Fetch context labels for property-linked convos
      Promise.all(convos.filter((c: any) => c.context_type === "property" && c.context_id).map((c: any) =>
        supabase.from("properties").select("property_name").eq("id", c.context_id).single().then((r) => ({ id: c.id, label: r.data?.property_name }))
      )),
    ]);

    const profileMap = new Map((profilesRes.data || []).map((p) => [p.user_id, p]));
    const unreadMap = new Map<string, number>();
    (unreadRes.data || []).forEach((m: any) => {
      unreadMap.set(m.conversation_id, (unreadMap.get(m.conversation_id) || 0) + 1);
    });
    const lastMsgMap = new Map(lastMsgRes.map((m: any) => [m.id, m.content]));
    const contextMap = new Map(contextRes.map((c: any) => [c.id, c.label]));

    const fiveMinAgo = Date.now() - 5 * 60 * 1000;

    setConversations(
      convos.map((c: any) => {
        const partnerId = c.participant_a === user.id ? c.participant_b : c.participant_a;
        const profile = profileMap.get(partnerId);
        return {
          ...c,
          partner_id: partnerId,
          partner_name: profile?.full_name || "User",
          partner_avatar: profile?.avatar_url || null,
          is_online: profile?.last_seen_at ? new Date(profile.last_seen_at).getTime() > fiveMinAgo : false,
          unread_count: unreadMap.get(c.id) || 0,
          last_message: lastMsgMap.get(c.id) || "",
          context_label: contextMap.get(c.id) || (c.context_type === "roommate" ? "Roommate Match" : undefined),
        };
      })
    );
    setLoading(false);
  }, [user]);

  // Auto-create conversation if ?to= param
  useEffect(() => {
    if (!user || !targetUserId || targetUserId === user.id) return;
    const initConvo = async () => {
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
        const insertData: any = { participant_a: user.id, participant_b: targetUserId };
        if (contextType) insertData.context_type = contextType;
        if (contextId) insertData.context_id = contextId;
        const { data: newConvo, error } = await (supabase as any)
          .from("conversations")
          .insert(insertData)
          .select()
          .single();
        if (!error && newConvo) setActiveConvo(newConvo.id);
      }
      fetchConversations();
    };
    initConvo();
  }, [user, targetUserId, contextType, contextId, fetchConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

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

    // Realtime messages
    const channel = supabase
      .channel(`messages-${activeConvo}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConvo}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          if (user && (payload.new as Message).sender_id !== user.id) {
            (supabase as any).from("messages").update({ read: true }).eq("id", (payload.new as Message).id);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConvo}` },
        (payload) => {
          setMessages((prev) => prev.map((m) => m.id === (payload.new as Message).id ? payload.new as Message : m));
        }
      )
      .subscribe();

    // Typing presence channel
    const presenceChannel = supabase.channel(`typing-${activeConvo}`);
    presenceChannel
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.user_id !== user?.id) {
          setPartnerTyping(true);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
    };
  }, [activeConvo, user]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partnerTyping]);

  // Broadcast typing
  const broadcastTyping = useCallback(() => {
    if (!activeConvo || !user) return;
    supabase.channel(`typing-${activeConvo}`).send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: user.id },
    });
  }, [activeConvo, user]);

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
      await (supabase as any)
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", activeConvo);
      fetchConversations();
    }
    setSending(false);
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const activeConversation = conversations.find((c) => c.id === activeConvo);

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach((m) => {
    const day = format(new Date(m.created_at), "yyyy-MM-dd");
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === day) last.messages.push(m);
    else groupedMessages.push({ date: day, messages: [m] });
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-6">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl font-bold mb-5"
        >
          Messages
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-0 md:grid-cols-[320px_1fr] h-[calc(100vh-200px)] rounded-xl overflow-hidden border border-border/50 shadow-sm"
        >
          {/* Conversation list */}
          <div className={`bg-card border-r border-border/50 ${activeConvo ? "hidden md:block" : ""}`}>
            <ConversationList
              conversations={conversations}
              activeConvo={activeConvo}
              onSelect={setActiveConvo}
              loading={loading}
            />
          </div>

          {/* Chat area */}
          <div className={`bg-card flex flex-col ${!activeConvo ? "hidden md:flex" : "flex"}`}>
            {activeConvo && activeConversation ? (
              <>
                <ChatHeader
                  partnerName={activeConversation.partner_name}
                  partnerAvatar={activeConversation.partner_avatar}
                  isOnline={activeConversation.is_online}
                  contextType={activeConversation.context_type}
                  contextId={activeConversation.context_id}
                  contextLabel={activeConversation.context_label}
                  onBack={() => setActiveConvo(null)}
                />
                <ScrollArea className="flex-1 px-4 py-2">
                  <div className="space-y-1">
                    {groupedMessages.map((group) => (
                      <div key={group.date}>
                        <DateSeparator date={group.messages[0].created_at} />
                        <div className="space-y-1">
                          {group.messages.map((m, i) => {
                            const prevMsg = group.messages[i - 1];
                            const showAvatar = !prevMsg || prevMsg.sender_id !== m.sender_id;
                            return (
                              <MessageBubble
                                key={m.id}
                                message={m}
                                isOwn={m.sender_id === user.id}
                                showAvatar={showAvatar}
                                partnerName={activeConversation.partner_name}
                                partnerAvatar={activeConversation.partner_avatar}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <AnimatePresence>
                      {partnerTyping && <TypingIndicator name={activeConversation.partner_name} />}
                    </AnimatePresence>
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>
                <div className="border-t border-border/50 p-3 flex gap-2 bg-card">
                  <Input
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      broadcastTyping();
                    }}
                    placeholder="Type a message..."
                    maxLength={1000}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    className="bg-muted/50 border-0"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    size="icon"
                    className="gradient-primary text-primary-foreground flex-shrink-0"
                  >
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
          </div>
        </motion.div>
      </main>
    </div>
  );
}
