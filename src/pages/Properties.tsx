import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/VerificationBadge";
import { Input } from "@/components/ui/input";
import { Building2, MapPin, Users, Wifi, Zap, Shield, Droplets, Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const facilityIcons: Record<string, typeof Wifi> = {
  "Wi-Fi": Wifi,
  "Electricity": Zap,
  "Security": Shield,
  "Water": Droplets,
};

export default function Properties() {
  const [properties, setProperties] = useState<Tables<"properties">[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("properties")
      .select("*")
      .eq("verification_status", "approved")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProperties(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = properties.filter(
    (p) =>
      p.property_name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase()) ||
      (p.location || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Browse Properties</h1>
          <p className="text-muted-foreground">Verified accommodations in Ibadan</p>
        </div>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, address, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            maxLength={100}
          />
        </div>
        {loading ? (
          <p className="text-muted-foreground">Loading properties...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground">No properties found.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Card key={p.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                <div className="gradient-primary p-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 capitalize">
                      {p.property_type}
                    </Badge>
                    <VerificationBadge status={p.verification_status} />
                  </div>
                </div>
                <CardContent className="pt-4">
                  <h3 className="mb-1 font-display text-lg font-semibold">{p.property_name}</h3>
                  <div className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />{p.address}
                  </div>
                  {p.proximity_to_campus && (
                    <p className="mb-3 text-xs text-muted-foreground">📍 {p.proximity_to_campus}</p>
                  )}
                  <div className="mb-3 flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-primary" />
                      {p.available_rooms}/{p.total_rooms} rooms
                    </span>
                  </div>
                  {p.facilities && p.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.facilities.map((f) => (
                        <Badge key={f} variant="secondary" className="text-xs">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">by {p.landlord_name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
