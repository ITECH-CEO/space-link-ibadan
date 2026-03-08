import { useState } from "react";
import { motion } from "framer-motion";
import { Check, CheckCheck, Reply, Smile, FileText, Download, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


export interface MessageReaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  message_type?: string;
  file_url?: string | null;
  file_name?: string | null;
  reply_to_id?: string | null;
  reply_to?: { content: string; sender_name: string } | null;
  reactions?: MessageReaction[];
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🙏"];

interface Props {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  partnerName?: string;
  partnerAvatar?: string | null;
  onReply?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

export function MessageBubble({ message, isOwn, showAvatar, partnerName, partnerAvatar, onReply, onReact }: Props) {
  const [hovered, setHovered] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isImage = message.message_type === "image";
  const isFile = message.message_type === "file";

  const fileExt = message.file_name?.split(".").pop()?.toLowerCase();
  const isImageFile = isImage || ["jpg", "jpeg", "png", "gif", "webp"].includes(fileExt || "");

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.15 }}
        className={`flex gap-2 group ${isOwn ? "justify-end" : "justify-start"}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
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

        <div className="relative max-w-[70%]">
          {/* Action buttons on hover */}
          <div
            className={`absolute ${isOwn ? "left-0 -translate-x-full" : "right-0 translate-x-full"} top-0 flex items-center gap-0.5 px-1 transition-opacity ${
              hovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onReply?.(message)}>
              <Reply className="h-3.5 w-3.5" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Smile className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" side="top">
                <div className="flex gap-1">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onReact?.(message.id, emoji)}
                      className="text-lg hover:scale-125 transition-transform p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Reply quote */}
          {message.reply_to && (
            <div
              className={`text-[11px] px-3 py-1.5 mb-0.5 rounded-t-xl border-l-2 ${
                isOwn
                  ? "bg-primary/20 border-l-primary-foreground/30 text-primary-foreground/70"
                  : "bg-muted/80 border-l-primary text-muted-foreground"
              }`}
            >
              <span className="font-semibold block truncate">{message.reply_to.sender_name}</span>
              <span className="truncate block">{message.reply_to.content}</span>
            </div>
          )}

          {/* Message body */}
          <div
            className={`rounded-2xl text-sm leading-relaxed overflow-hidden ${
              isOwn
                ? "gradient-primary text-primary-foreground rounded-br-md"
                : "bg-muted text-foreground rounded-bl-md"
            } ${message.reply_to ? "rounded-t-none" : ""}`}
          >
            {/* Image attachment */}
            {isImageFile && message.file_url && (
              <button onClick={() => setLightboxOpen(true)} className="block w-full">
                <img
                  src={message.file_url}
                  alt={message.file_name || "Image"}
                  className="w-full max-h-60 object-cover"
                />
              </button>
            )}

            {/* File attachment */}
            {isFile && !isImageFile && message.file_url && (
              <a
                href={message.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 px-3.5 py-2 ${isOwn ? "hover:bg-primary-foreground/10" : "hover:bg-foreground/5"} transition-colors`}
              >
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isOwn ? "bg-primary-foreground/20" : "bg-primary/10"}`}>
                  <FileText className={`h-4 w-4 ${isOwn ? "text-primary-foreground" : "text-primary"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{message.file_name || "File"}</p>
                  <p className={`text-[10px] ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {fileExt?.toUpperCase()} file
                  </p>
                </div>
                <Download className="h-4 w-4 flex-shrink-0 opacity-60" />
              </a>
            )}

            {/* Text content */}
            {message.content && (
              <div className="px-3.5 py-2">
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              </div>
            )}

            {/* Timestamp + read receipts */}
            <div className={`flex items-center justify-end gap-1 px-3.5 pb-1.5 -mt-0.5 ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
              <span className="text-[10px]">{format(new Date(message.created_at), "HH:mm")}</span>
              {isOwn && (
                message.read ? (
                  <CheckCheck className="h-3.5 w-3.5 text-blue-300" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )
              )}
            </div>
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
              {message.reactions.map((r) => (
                <button
                  key={r.emoji}
                  onClick={() => onReact?.(message.id, r.emoji)}
                  className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition-colors ${
                    r.reacted
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted border-border hover:bg-muted/80"
                  }`}
                >
                  <span>{r.emoji}</span>
                  {r.count > 1 && <span className="text-[10px]">{r.count}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Image lightbox */}
      {isImageFile && message.file_url && lightboxOpen && (
        <ImageLightbox
          images={[message.file_url]}
          initialIndex={0}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
