import { useState } from "react";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Users, Building2, Sparkles, X, Heart, MessageSquare, ChevronLeft, GraduationCap, BookOpen, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RoommateMatchDetail {
  id: string;
  status: string;
  compatibility_score: number | null;
  ai_reasoning: string | null;
  partner_name: string;
  property_name: string | null;
  partner_user_id?: string;
}

interface RoommateSwipeCardProps {
  matches: RoommateMatchDetail[];
  onMessage: (userId: string) => void;
  onBack: () => void;
}

export function RoommateSwipeCard({ matches, onMessage, onBack }: RoommateSwipeCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gone] = useState(() => new Set<number>());
  const [swipeAction, setSwipeAction] = useState<"like" | "nope" | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const current = matches[currentIndex];
  const next = matches[currentIndex + 1];

  if (!current && gone.size === matches.length) {
    return (
      <div className="flex flex-col items-center py-12">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Heart className="h-10 w-10 text-muted-foreground/40" />
        </div>
        <h3 className="font-display text-xl font-bold mb-2">No More Matches</h3>
        <p className="text-sm text-muted-foreground mb-4">You've seen all your roommate matches!</p>
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Back to list
        </Button>
      </div>
    );
  }

  if (!current) return null;

  const scoreColor =
    (current.compatibility_score ?? 0) >= 70
      ? "text-success"
      : (current.compatibility_score ?? 0) >= 50
      ? "text-warning"
      : "text-muted-foreground";

  const scoreRing =
    (current.compatibility_score ?? 0) >= 70
      ? "border-success/40 shadow-success/20"
      : (current.compatibility_score ?? 0) >= 50
      ? "border-warning/40 shadow-warning/20"
      : "border-muted-foreground/20";

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 120;
    if (Math.abs(info.offset.x) > threshold) {
      const dir = info.offset.x > 0 ? "like" : "nope";
      setSwipeAction(dir);
      gone.add(currentIndex);
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setSwipeAction(null);
      }, 300);
    }
  };

  const handleAction = (action: "like" | "nope") => {
    setSwipeAction(action);
    gone.add(currentIndex);
    setTimeout(() => {
      setCurrentIndex((i) => i + 1);
      setSwipeAction(null);
    }, 400);
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const scorePercent = current.compatibility_score ?? 0;
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (scorePercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Back to list
        </Button>
        <span className="text-sm text-muted-foreground font-medium">
          {currentIndex + 1} / {matches.length}
        </span>
      </div>

      {/* Card Stack */}
      <div className="relative w-full max-w-[340px] h-[520px]">
        {/* Background card (next) */}
        {next && (
          <div className="absolute inset-0 rounded-2xl bg-card border border-border/50 scale-[0.95] translate-y-3 opacity-50" />
        )}

        {/* Active card */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={current.id}
            style={{ x, rotate }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.9}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              x: swipeAction === "like" ? 400 : swipeAction === "nope" ? -400 : 0,
              rotateZ: swipeAction === "like" ? 20 : swipeAction === "nope" ? -20 : 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
          >
            <div className="h-full rounded-2xl overflow-hidden border-2 border-border bg-card shadow-2xl flex flex-col">
              {/* Swipe overlays */}
              <motion.div
                style={{ opacity: likeOpacity }}
                className="absolute inset-0 z-10 pointer-events-none rounded-2xl border-4 border-success bg-success/5 flex items-center justify-center"
              >
                <div className="rotate-[-20deg] border-4 border-success rounded-xl px-6 py-2">
                  <span className="text-4xl font-black text-success tracking-wider">LIKE</span>
                </div>
              </motion.div>
              <motion.div
                style={{ opacity: nopeOpacity }}
                className="absolute inset-0 z-10 pointer-events-none rounded-2xl border-4 border-destructive bg-destructive/5 flex items-center justify-center"
              >
                <div className="rotate-[20deg] border-4 border-destructive rounded-xl px-6 py-2">
                  <span className="text-4xl font-black text-destructive tracking-wider">NOPE</span>
                </div>
              </motion.div>

              {/* Profile header */}
              <div className="relative gradient-primary px-6 pt-8 pb-14 text-center">
                <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-primary-foreground/20 border-4 border-primary-foreground/30 backdrop-blur-sm">
                  <span className="font-display text-3xl font-bold text-primary-foreground">
                    {getInitials(current.partner_name)}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-bold text-primary-foreground">
                  {current.partner_name}
                </h3>
                {current.property_name && (
                  <p className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-primary-foreground/70">
                    <Building2 className="h-3.5 w-3.5" /> {current.property_name}
                  </p>
                )}
              </div>

              {/* Compatibility ring - floating over the boundary */}
              <div className="flex justify-center -mt-10 relative z-10">
                <div className={cn("relative h-20 w-20 rounded-full bg-card border-4 shadow-lg flex items-center justify-center", scoreRing)}>
                  <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" strokeWidth="4" className="stroke-muted/30" />
                    <circle
                      cx="50" cy="50" r="42" fill="none" strokeWidth="4"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className={scorePercent >= 70 ? "stroke-success" : scorePercent >= 50 ? "stroke-warning" : "stroke-muted-foreground"}
                    />
                  </svg>
                  <div className="text-center">
                    <span className={cn("font-display text-xl font-black", scoreColor)}>{scorePercent}%</span>
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div className="flex-1 px-5 pt-3 pb-5 flex flex-col gap-3 overflow-y-auto">
                <p className="text-center text-xs text-muted-foreground font-medium uppercase tracking-wider">Compatibility</p>

                {/* AI Insight */}
                {current.ai_reasoning && (
                  <div className="rounded-xl bg-muted/40 p-4 border border-border/50">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> AI Match Insight
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed line-clamp-4">
                      "{current.ai_reasoning}"
                    </p>
                  </div>
                )}

                {/* Status badge */}
                <div className="flex justify-center">
                  <Badge variant="outline" className={cn(
                    "px-4 py-1 text-xs font-semibold",
                    current.status === "accepted" ? "bg-success/10 text-success border-success/20" :
                    current.status === "rejected" ? "bg-destructive/10 text-destructive border-destructive/20" :
                    "bg-warning/10 text-warning border-warning/20"
                  )}>
                    {current.status}
                  </Badge>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Tinder-style action buttons */}
      <div className="mt-8 flex items-center gap-5">
        <button
          onClick={() => handleAction("nope")}
          className="group flex h-16 w-16 items-center justify-center rounded-full border-2 border-destructive/30 bg-card shadow-lg transition-all hover:scale-110 hover:border-destructive hover:shadow-destructive/20 active:scale-95"
        >
          <X className="h-7 w-7 text-destructive transition-transform group-hover:scale-110" />
        </button>

        {current.partner_user_id && (
          <button
            onClick={() => onMessage(current.partner_user_id!)}
            className="group flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/30 bg-card shadow-md transition-all hover:scale-110 hover:border-primary hover:shadow-primary/20 active:scale-95"
          >
            <MessageSquare className="h-5 w-5 text-primary" />
          </button>
        )}

        <button
          onClick={() => handleAction("like")}
          className="group flex h-16 w-16 items-center justify-center rounded-full border-2 border-success/30 bg-card shadow-lg transition-all hover:scale-110 hover:border-success hover:shadow-success/20 active:scale-95"
        >
          <Heart className="h-7 w-7 text-success transition-transform group-hover:scale-110" />
        </button>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">Swipe right to like • Swipe left to pass</p>
    </div>
  );
}
