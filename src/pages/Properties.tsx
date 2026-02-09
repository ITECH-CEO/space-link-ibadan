import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/VerificationBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, MapPin, Users, Wifi, Zap, Shield, Droplets, Search, DollarSign } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface PropertyWithRooms extends Tables<"properties"> {
  room_types: Tables<"room_types">[];
}

export default function Properties() {
  const [properties, setProperties] = useState<PropertyWithRooms[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("properties")
      .select("*, room_types(*)")
      .eq("verification_status", "approved")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProperties((data as PropertyWithRooms[]) || []);
        setLoading(false);
      });
  }, []);

  const filtered = properties.filter((p) => {
    const matchesSearch =
      p.property_name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase()) ||
      (p.location || "").toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || p.property_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getMinPrice = (p: PropertyWithRooms) => {
    if (!p.room_types || p.room_types.length === 0) return null;
    return Math.min(...p.room_types.map((r) => r.price));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Browse Properties</h1>
          <p className="text-muted-foreground">Verified accommodations in Ibadan</p>
        </div>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, address, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              maxLength={100}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="shared">Shared</SelectItem>
              <SelectItem value="hostel">Hostel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {loading ? (
          <p className="text-muted-foreground">Loading properties...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No properties found.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const minPrice = getMinPrice(p);
              return (
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
                      {minPrice && (
                        <span className="flex items-center gap-1 font-semibold text-primary">
                          <DollarSign className="h-4 w-4" />
                          From ₦{minPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {p.facilities && p.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {p.facilities.map((f) => (
                          <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                        ))}
                      </div>
                    )}
                    {p.room_types && p.room_types.length > 0 && (
                      <div className="border-t pt-2 mt-2">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Room Types:</p>
                        <div className="flex flex-wrap gap-1">
                          {p.room_types.map((rt) => (
                            <Badge key={rt.id} variant="outline" className="text-xs">
                              {rt.name} — ₦{rt.price.toLocaleString()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">by {p.landlord_name}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
