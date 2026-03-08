import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Users, Building2, Sparkles, X, Heart, MessageSquare, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
  const [direction, setDirection] = useState(0);

  const current = matches[currentIndex];
  if (!current) return null;

  const scoreColor =
    (current.compatibility_score ?? 0) >= 70
      ? "text-success"
      : (current.compatibility_score ?? 0) >= 50
      ? "text-warning"
      : "text-muted-foreground";

  const goNext = () => {
    if (currentIndex < matches.length - 1) {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) goPrev();
    else if (info.offset.x < -100) goNext();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Back to list
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} of {matches.length}
        </span>
      </div>

      <div className="relative w-full max-w-sm h-[420px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 200, rotateZ: direction * 10 }}
            animate={{ opacity: 1, x: 0, rotateZ: 0 }}
            exit={{ opacity: 0, x: -direction * 200, rotateZ: -direction * 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            className="absolute inset-0"
          >
            <Card className="h-full border-2 shadow-xl overflow-hidden">
              {/* Header gradient */}
              <div className="gradient-primary px-6 py-8 text-center">
                <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary-foreground/20">
                  <Users className="h-10 w-10 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold text-primary-foreground">
                  {current.partner_name}
                </h3>
                {current.property_name && (
                  <p className="mt-1 flex items-center justify-center gap-1 text-sm text-primary-foreground/70">
                    <Building2 className="h-3 w-3" /> {current.property_name}
                  </p>
                )}
              </div>

              <CardContent className="p-6 flex flex-col gap-4">
                {/* Compatibility score - big and centered */}
                <div className="text-center">
                  <div className={`font-display text-5xl font-bold ${scoreColor}`}>
                    {current.compatibility_score ?? 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Compatibility Score</p>
                </div>

                {/* AI reasoning */}
                {current.ai_reasoning && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                      <Sparkles className="h-3 w-3" /> AI Insight
                    </div>
                    <p className="text-xs text-foreground italic line-clamp-3">"{current.ai_reasoning}"</p>
                  </div>
                )}

                <Badge variant="outline" className={`self-center ${
                  current.status === "accepted" ? "bg-success/10 text-success border-success/20" :
                  current.status === "rejected" ? "bg-destructive/10 text-destructive border-destructive/20" :
                  "bg-warning/10 text-warning border-warning/20"
                }`}>
                  {current.status}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex items-center gap-4">
        <Button
          variant="outline"
          size="lg"
          className="h-14 w-14 rounded-full border-2 border-destructive/30 p-0"
          onClick={goPrev}
          disabled={currentIndex === 0}
        >
          <X className="h-6 w-6 text-destructive" />
        </Button>

        {current.partner_user_id && (
          <Button
            onClick={() => onMessage(current.partner_user_id!)}
            className="gradient-primary text-primary-foreground h-12 rounded-full px-6"
          >
            <MessageSquare className="mr-2 h-4 w-4" /> Message
          </Button>
        )}

        <Button
          variant="outline"
          size="lg"
          className="h-14 w-14 rounded-full border-2 border-success/30 p-0"
          onClick={goNext}
          disabled={currentIndex === matches.length - 1}
        >
          <Heart className="h-6 w-6 text-success" />
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">Swipe or use buttons to browse matches</p>
    </div>
  );
}
