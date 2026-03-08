import { Button } from "@/components/ui/button";
import { ArrowLeft, User, MapPin, Users, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  partnerName: string;
  partnerAvatar?: string | null;
  isOnline?: boolean;
  contextType?: string | null;
  contextId?: string | null;
  contextLabel?: string;
  onBack: () => void;
}

export function ChatHeader({ partnerName, partnerAvatar, isOnline, contextType, contextId, contextLabel, onBack }: Props) {
  const navigate = useNavigate();

  const handleContextClick = () => {
    if (!contextType || !contextId) return;
    if (contextType === "property") navigate(`/property/${contextId}`);
    if (contextType === "roommate") navigate("/my-matches");
  };

  return (
    <div className="border-b border-border/50 px-4 py-3 flex items-center gap-3">
      <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 flex-shrink-0" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
      </Button>

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {partnerAvatar ? (
          <img src={partnerAvatar} alt={partnerName} className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
        )}
        {isOnline && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm truncate">{partnerName}</h3>
        <div className="flex items-center gap-1">
          {isOnline ? (
            <span className="text-[11px] text-emerald-600">Online</span>
          ) : (
            <span className="text-[11px] text-muted-foreground">Offline</span>
          )}
          {contextLabel && (
            <>
              <span className="text-[11px] text-muted-foreground">·</span>
              <button
                onClick={handleContextClick}
                className="flex items-center gap-0.5 text-[11px] text-primary hover:underline truncate"
              >
                {contextType === "property" ? <MapPin className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                {contextLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
