import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageCircle, Search, User, MapPin, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { format, isToday, isYesterday } from "date-fns";

export interface Conversation {
  id: string;
  participant_a: string;
  participant_b: string;
  last_message_at: string;
  partner_name: string;
  partner_id: string;
  partner_avatar?: string | null;
  unread_count: number;
  last_message?: string;
  context_type?: string | null;
  context_id?: string | null;
  context_label?: string;
  is_online?: boolean;
}

interface Props {
  conversations: Conversation[];
  activeConvo: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "dd/MM/yy");
}

function ContextIcon({ type }: { type?: string | null }) {
  if (type === "property") return <MapPin className="h-3 w-3 text-primary" />;
  if (type === "roommate") return <Users className="h-3 w-3 text-accent" />;
  return null;
}

export function ConversationList({ conversations, activeConvo, onSelect, loading }: Props) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) =>
    c.partner_name.toLowerCase().includes(search.toLowerCase()) ||
    c.context_label?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="pl-9 h-9 bg-muted/50 border-0 text-sm"
          />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-muted rounded" />
                  <div className="h-2.5 w-36 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground/20 mb-2" />
            <p className="text-sm text-muted-foreground">
              {search ? "No matches found" : "No conversations yet"}
            </p>
          </div>
        ) : (
          filtered.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onSelect(c.id)}
              className={`w-full text-left px-3 py-3 transition-all hover:bg-muted/50 ${
                activeConvo === c.id
                  ? "bg-primary/5 border-l-2 border-l-primary"
                  : "border-l-2 border-l-transparent"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar with online dot */}
                <div className="relative flex-shrink-0">
                  {c.partner_avatar ? (
                    <img
                      src={c.partner_avatar}
                      alt={c.partner_name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  {c.is_online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">{c.partner_name}</span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                      {formatTime(c.last_message_at)}
                    </span>
                  </div>
                  {/* Context label */}
                  {c.context_label && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <ContextIcon type={c.context_type} />
                      <span className="text-[10px] text-muted-foreground truncate">{c.context_label}</span>
                    </div>
                  )}
                  {/* Last message preview + unread */}
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-muted-foreground truncate pr-2">
                      {c.last_message || "Start a conversation..."}
                    </p>
                    {c.unread_count > 0 && (
                      <Badge className="bg-primary text-primary-foreground text-[10px] h-5 min-w-5 flex items-center justify-center rounded-full flex-shrink-0">
                        {c.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          ))
        )}
      </ScrollArea>
    </div>
  );
}
