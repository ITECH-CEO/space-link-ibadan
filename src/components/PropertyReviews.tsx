import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Star, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export function PropertyReviews({ propertyId }: { propertyId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const fetchReviews = async () => {
    const { data } = await (supabase as any)
      .from("property_reviews")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });
    setReviews(data || []);
    if (user && data) {
      setHasReviewed(data.some((r: Review) => (r as any).user_id === user.id));
    }
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, [propertyId, user]);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle()
        .then(({ data }) => { if (data?.full_name) setReviewerName(data.full_name); });
    }
  }, [user]);

  const submitReview = async () => {
    if (!user) { toast.error("Please sign in to leave a review"); return; }
    if (rating === 0) { toast.error("Please select a rating"); return; }
    setSubmitting(true);
    const { error } = await (supabase as any).from("property_reviews").insert({
      property_id: propertyId,
      user_id: user.id,
      reviewer_name: reviewerName || "Anonymous",
      rating,
      comment: comment.trim() || null,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Review submitted!");
      setDialogOpen(false);
      setRating(0);
      setComment("");
      fetchReviews();
    }
    setSubmitting(false);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Reviews
          </h2>
          {avgRating && (
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span className="text-sm font-bold">{avgRating}</span>
              <span className="text-xs opacity-70">({reviews.length})</span>
            </div>
          )}
        </div>
        {user && !hasReviewed && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary text-primary-foreground">
                <Star className="mr-1.5 h-3.5 w-3.5" /> Write Review
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Rate this property</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Your rating</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setRating(s)} className="p-1 transition-transform hover:scale-110">
                        <Star className={cn("h-8 w-8 transition-colors", s <= rating ? "fill-warning text-warning" : "text-muted-foreground/20")} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Comment (optional)</Label>
                  <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." className="mt-1.5" maxLength={500} />
                </div>
                <Button onClick={submitReview} disabled={submitting} className="w-full gradient-primary text-primary-foreground">
                  {submitting ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {reviews.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-10 text-center">
            <Star className="mx-auto h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground text-sm">No reviews yet. Be the first to review!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <Card className="card-elevated">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold">{r.reviewer_name}</p>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex gap-0.5 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn("h-3.5 w-3.5", s <= r.rating ? "fill-warning text-warning" : "text-muted-foreground/15")} />
                        ))}
                      </div>
                      {r.comment && <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
