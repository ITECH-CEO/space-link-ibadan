import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Send, Paperclip, Smile, X, Image, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Message } from "./MessageBubble";

const EMOJI_LIST = [
  "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
  "🙂", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗",
  "😜", "🤪", "😝", "🤑", "🤗", "🤔", "😐", "😑",
  "😶", "🙄", "😏", "😣", "😥", "😮", "🤐", "😯",
  "😴", "🤤", "😛", "😲", "🤯", "😳", "🥺", "😢",
  "👍", "👎", "👏", "🙌", "🤝", "🙏", "💪", "🔥",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
  "✅", "❌", "⭐", "🎉", "🎊", "💯", "🏠", "📍",
];

interface Props {
  onSend: (content: string, messageType: string, fileUrl?: string, fileName?: string, replyToId?: string) => void;
  sending: boolean;
  replyTo: Message | null;
  onCancelReply: () => void;
  onTyping: () => void;
  conversationId: string;
  userId: string;
}

export function ChatInput({ onSend, sending, replyTo, onCancelReply, onTyping, conversationId, userId }: Props) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!text.trim() && !uploading) return;
    onSend(text.trim(), "text", undefined, undefined, replyTo?.id);
    setText("");
    onCancelReply();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${conversationId}/${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("message-attachments")
      .upload(path, file);

    if (uploadError) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("message-attachments")
      .getPublicUrl(path);

    const isImage = file.type.startsWith("image/");
    const messageType = isImage ? "image" : "file";

    onSend(text.trim(), messageType, urlData.publicUrl, file.name, replyTo?.id);
    setText("");
    onCancelReply();
    setUploading(false);

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const insertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  return (
    <div className="border-t border-border/50 bg-card">
      {/* Reply bar */}
      {replyTo && (
        <div className="px-4 pt-2 flex items-center gap-2">
          <div className="flex-1 bg-muted/60 rounded-lg px-3 py-1.5 border-l-2 border-l-primary">
            <p className="text-[10px] font-semibold text-primary">Replying to</p>
            <p className="text-xs text-muted-foreground truncate">{replyTo.content || "Attachment"}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={onCancelReply}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <div className="p-3 flex items-end gap-2">
        {/* File upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Message input */}
        <Input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTyping();
          }}
          placeholder={uploading ? "Uploading..." : "Type a message..."}
          maxLength={1000}
          disabled={uploading}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          className="bg-muted/50 border-0"
        />

        {/* Emoji picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" side="top" align="end">
            <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => insertEmoji(emoji)}
                  className="text-lg hover:scale-110 hover:bg-muted rounded p-1 transition-transform text-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={sending || uploading || !text.trim()}
          size="icon"
          className="gradient-primary text-primary-foreground flex-shrink-0 h-9 w-9"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
