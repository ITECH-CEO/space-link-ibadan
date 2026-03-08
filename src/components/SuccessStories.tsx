import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface ReviewWithProperty {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  property_id: string;
  property_name?: string;
}

export function SuccessStories() {
  const [reviews, setReviews] = useState<ReviewWithProperty[]>([]);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from("property_reviews")
        .select("id, reviewer_name, rating, comment, property_id")
        .gte("rating", 4)
        .not("comment", "is", null)
        .order("created_at", { ascending: false })
        .limit(6);

      if (data && data.length > 0) {
        const propIds = [...new Set(data.map((r) => r.property_id))];
        const { data: props } = await supabase
          .from("properties")
          .select("id, property_name")
          .in("id", propIds);
        const propMap = new Map((props || []).map((p) => [p.id, p.property_name]));

        setReviews(
          data.map((r) => ({ ...r, property_name: propMap.get(r.property_id) }))
        );
      }
    };
    fetchReviews();
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="py-20 bg-muted/50">
      <div className="container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-4 font-display text-3xl font-bold">What Our Users Say</h2>
          <p className="text-muted-foreground">Real reviews from verified tenants</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {reviews.slice(0, 3).map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-0 shadow-lg">
                <CardContent className="pt-6">
                  <Quote className="h-8 w-8 text-accent/30 mb-3" />
                  <p className="text-sm text-foreground mb-4 italic">"{r.comment}"</p>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: r.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="font-display font-semibold text-sm">{r.reviewer_name}</p>
                  {r.property_name && (
                    <p className="text-xs text-muted-foreground">{r.property_name}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
