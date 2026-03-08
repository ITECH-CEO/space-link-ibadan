import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const campuses = [
  { name: "UNILAG", location: "Lagos", keyword: "unilag" },
  { name: "UI", location: "Ibadan", keyword: "ibadan" },
  { name: "UNIBEN", location: "Benin", keyword: "benin" },
  { name: "OAU", location: "Ile-Ife", keyword: "ife" },
  { name: "FUTA", location: "Akure", keyword: "akure" },
  { name: "UNIPORT", location: "Port Harcourt", keyword: "port harcourt" },
];

export function CampusCards() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // Fetch property counts per campus keyword
    const fetchCounts = async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, address, location, property_name")
        .eq("verification_status", "approved");

      if (!data) return;

      const result: Record<string, number> = {};
      for (const c of campuses) {
        const kw = c.keyword.toLowerCase();
        result[c.keyword] = data.filter(
          (p) =>
            (p.address || "").toLowerCase().includes(kw) ||
            (p.location || "").toLowerCase().includes(kw) ||
            (p.property_name || "").toLowerCase().includes(kw)
        ).length;
      }
      setCounts(result);
    };
    fetchCounts();
  }, []);

  return (
    <section className="py-12 bg-card border-b">
      <div className="container">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="mb-2 font-display text-2xl font-bold md:text-3xl">Suggested Destinations</h2>
          <p className="text-muted-foreground text-sm">Browse properties near popular Nigerian campuses</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {campuses.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              viewport={{ once: true }}
            >
              <Link
                to={`/properties?search=${encodeURIComponent(c.keyword)}`}
                className="block rounded-xl border border-border bg-background p-4 text-center transition-all hover:border-primary hover:shadow-md hover:glow-primary group"
              >
                <div className="font-display font-bold text-primary text-lg group-hover:scale-105 transition-transform">
                  Properties in<br />{c.location}
                </div>
                <div className="mt-1 text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {counts[c.keyword] !== undefined ? `${counts[c.keyword]} properties` : "—"}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
