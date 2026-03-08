import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Users, Star } from "lucide-react";
import { motion } from "framer-motion";
import { PropertyCarousel } from "@/components/PropertyCarousel";
import type { Tables } from "@/integrations/supabase/types";

interface PropertyWithRooms extends Tables<"properties"> {
  room_types: Tables<"room_types">[];
}

export function FeaturedProperties() {
  const [properties, setProperties] = useState<PropertyWithRooms[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("properties")
      .select("*, room_types(*)")
      .eq("verification_status", "approved")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        setProperties((data as PropertyWithRooms[]) || []);
        setLoading(false);
      });
  }, []);

  const getMinPrice = (p: PropertyWithRooms) => {
    if (!p.room_types || p.room_types.length === 0) return null;
    return Math.min(...p.room_types.map((r) => r.price));
  };

  if (loading || properties.length === 0) return null;

  return (
    <section className="py-16 bg-background">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold">Featured Properties</h2>
            <p className="text-muted-foreground">Newly listed & verified accommodations</p>
          </div>
          <Link to="/properties">
            <Button variant="outline" className="hidden sm:flex">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((p, i) => {
            const minPrice = getMinPrice(p);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                viewport={{ once: true }}
              >
                <Link to={`/property/${p.id}`}>
                  <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:glow-primary cursor-pointer h-full card-elevated group">
                    <div className="relative">
                      <PropertyCarousel photos={p.photos || []} alt={p.property_name} />
                      <div className="absolute top-3 left-3 z-10 flex gap-2">
                        <Badge variant="outline" className="bg-card/80 backdrop-blur-sm text-foreground border-border capitalize shadow-sm">
                          {p.property_type}
                        </Badge>
                      </div>
                      {minPrice && (
                        <div className="absolute bottom-3 left-3 z-10">
                          <span className="rounded-lg bg-card/90 backdrop-blur-sm px-3 py-1.5 font-display text-sm font-bold text-foreground shadow-sm">
                            From ₦{minPrice.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/yr</span>
                          </span>
                        </div>
                      )}
                      {p.available_rooms && p.available_rooms > 0 && p.available_rooms <= 3 && (
                        <div className="absolute top-3 right-3 z-10">
                          <Badge className="bg-destructive text-destructive-foreground text-xs">
                            {p.available_rooms} left!
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="pt-4">
                      <h3 className="mb-1 font-display text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1">
                        {p.property_name}
                      </h3>
                      <div className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="line-clamp-1">{p.address}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-primary" />
                          {p.available_rooms}/{p.total_rooms} rooms
                        </span>
                        {p.room_types && p.room_types.length > 0 && (
                          <span className="text-xs">{p.room_types.length} room type{p.room_types.length > 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link to="/properties">
            <Button variant="outline">
              View All Properties <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
