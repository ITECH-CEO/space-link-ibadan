import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const stories = [
  {
    name: "Adebayo O.",
    uni: "UNILAG",
    quote: "MyCrib matched me with a verified hostel 5 mins from campus. The whole process took less than 24 hours!",
    rating: 5,
  },
  {
    name: "Chioma & Blessing",
    uni: "UI",
    quote: "We were matched as roommates through the AI system. Same faculty, same budget — we've been great friends since!",
    rating: 5,
  },
  {
    name: "Emeka N.",
    uni: "UNIBEN",
    quote: "As a landlord, listing my property was seamless. I got verified tenants within a week. No stress at all.",
    rating: 5,
  },
];

export function SuccessStories() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-4 font-display text-3xl font-bold">Happy Tenants & Landlords</h2>
          <p className="text-muted-foreground">Real stories from our community</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {stories.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-0 shadow-lg">
                <CardContent className="pt-6">
                  <Quote className="h-8 w-8 text-accent/30 mb-3" />
                  <p className="text-sm text-foreground mb-4 italic">"{s.quote}"</p>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: s.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="font-display font-semibold text-sm">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.uni}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
