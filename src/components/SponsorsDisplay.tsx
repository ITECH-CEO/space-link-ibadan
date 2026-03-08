import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Award, ExternalLink } from "lucide-react";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
  tier: string;
  sponsor_type: string;
}

const tierLabel: Record<string, string> = {
  platinum: "Platinum Partner",
  gold: "Gold Partner",
  silver: "Silver Partner",
  bronze: "Supporter",
};

const tierColors: Record<string, string> = {
  platinum: "bg-primary/10 text-primary border-primary/20",
  gold: "bg-warning/10 text-warning border-warning/20",
  silver: "bg-muted text-muted-foreground border-border",
  bronze: "bg-accent/10 text-accent border-accent/20",
};

export function SponsorsDisplay({ propertyId }: { propertyId?: string }) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  useEffect(() => {
    const query = (supabase as any)
      .from("sponsors")
      .select("id, name, logo_url, website_url, description, tier, sponsor_type")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (propertyId) {
      // Show platform sponsors + property-specific sponsors
      query.or(`sponsor_type.eq.platform,property_id.eq.${propertyId}`);
    } else {
      query.eq("sponsor_type", "platform");
    }

    query.then(({ data }: any) => setSponsors(data || []));
  }, [propertyId]);

  if (sponsors.length === 0) return null;

  // Group by tier
  const tiers = ["platinum", "gold", "silver", "bronze"];
  const grouped = tiers.reduce((acc, t) => {
    const items = sponsors.filter(s => s.tier === t);
    if (items.length > 0) acc.push({ tier: t, items });
    return acc;
  }, [] as { tier: string; items: Sponsor[] }[]);

  return (
    <section className="py-12 bg-muted/30">
      <div className="container">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl font-bold">
              {propertyId ? "Sponsors & Partners" : "Our Sponsors & Backers"}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {propertyId
              ? "This property is supported by these partners"
              : "Proudly supported by organizations that believe in student housing"}
          </p>
        </div>

        {grouped.map(({ tier, items }) => (
          <div key={tier} className="mb-6 last:mb-0">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="outline" className={`${tierColors[tier]} text-xs`}>
                {tierLabel[tier] || tier}
              </Badge>
            </div>
            <div className={`flex flex-wrap items-center justify-center gap-6 ${
              tier === "platinum" ? "gap-8" : tier === "gold" ? "gap-6" : "gap-4"
            }`}>
              {items.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                >
                  <SponsorCard sponsor={s} size={tier === "platinum" ? "lg" : tier === "gold" ? "md" : "sm"} />
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SponsorCard({ sponsor, size }: { sponsor: Sponsor; size: "lg" | "md" | "sm" }) {
  const sizeClasses = {
    lg: "h-20 w-40",
    md: "h-14 w-28",
    sm: "h-10 w-24",
  };

  const Wrapper = sponsor.website_url ? "a" : "div";
  const wrapperProps = sponsor.website_url
    ? { href: sponsor.website_url, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="group flex flex-col items-center gap-2 rounded-xl bg-card border border-border/50 p-4 transition-all hover:shadow-md hover:border-primary/20 cursor-pointer"
      title={sponsor.description || sponsor.name}
    >
      {sponsor.logo_url ? (
        <img
          src={sponsor.logo_url}
          alt={sponsor.name}
          className={`${sizeClasses[size]} object-contain transition-transform group-hover:scale-105`}
        />
      ) : (
        <div className={`${sizeClasses[size]} rounded-lg bg-muted flex items-center justify-center`}>
          <Award className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div className="text-center">
        <p className={`font-semibold ${size === "lg" ? "text-sm" : "text-xs"} group-hover:text-primary transition-colors flex items-center gap-1`}>
          {sponsor.name}
          {sponsor.website_url && <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
        </p>
      </div>
    </Wrapper>
  );
}
