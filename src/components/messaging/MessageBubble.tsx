import { motion } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";
import { format } from "date-fns";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface Props {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  partnerName?: string;
  partnerAvatar?: string | null;
}

export function MessageBubble({ message, isOwn, showAvatar, partnerName, partnerAvatar }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.15 }}
      className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
    >
      {/* Partner avatar */}
      {!isOwn && showAvatar && (
        <div className="flex-shrink-0 mt-auto">
          {partnerAvatar ? (
            <img src={partnerAvatar} alt={partnerName} className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary">
              {partnerName?.[0]?.toUpperCase() || "?"}
            </div>
          )}
        </div>
      )}
      {!isOwn && !showAvatar && <div className="w-7 flex-shrink-0" />}

      <div
        className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          isOwn
            ? "gradient-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
          <span className="text-[10px]">
            {format(new Date(message.created_at), "HH:mm")}
          </span>
          {isOwn && (
            message.read ? (
              <CheckCheck className="h-3.5 w-3.5 text-blue-300" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
