import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/VerificationBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, MapPin, Users, Search, Banknote, SlidersHorizontal, X, Heart, Map, List, Footprints, Navigation, Star, Bell } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";
import { PropertyMap } from "@/components/PropertyMap";
import { PropertyCarousel } from "@/components/PropertyCarousel";
import { PropertiesTour } from "@/components/tours/PropertiesTour";
import { SavedSearchManager } from "@/components/SavedSearchManager";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface PropertyWithRooms extends Tables<"properties"> {
  room_types: Tables<"room_types">[];
}

export default function Properties() {
  const { user } = useAuth();
  const [urlParams] = useSearchParams();
  const [properties, setProperties] = useState<PropertyWithRooms[]>([]);
  const [search, setSearch] = useState(urlParams.get("search") || "");
  const [typeFilter, setTypeFilter] = useState(urlParams.get("type") || "all");
  const [maxPrice, setMaxPrice] = useState<number>(500000);
  const [facilityFilter, setFacilityFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

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

    if (user) {
      (supabase as any)
        .from("saved_properties")
        .select("property_id")
        .eq("user_id", user.id)
        .then(({ data }: any) => {
          if (data) setSavedIds(new Set(data.map((d: any) => d.property_id)));
        });
    }
  }, [user]);

  const toggleSave = async (propertyId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error("Please sign in to save properties"); return; }
    setSavingId(propertyId);

    if (savedIds.has(propertyId)) {
      await (supabase as any).from("saved_properties").delete().eq("user_id", user.id).eq("property_id", propertyId);
      setSavedIds((prev) => { const n = new Set(prev); n.delete(propertyId); return n; });
      toast.success("Removed from saved");
    } else {
      await (supabase as any).from("saved_properties").insert({ user_id: user.id, property_id: propertyId });
      setSavedIds((prev) => new Set(prev).add(propertyId));
      toast.success("Property saved!");
    }
    setSavingId(null);
  };

  const allFacilities = [...new Set(properties.flatMap((p) => p.facilities || []))].sort();

  const getMinPrice = (p: PropertyWithRooms) => {
    if (!p.room_types || p.room_types.length === 0) return null;
    return Math.min(...p.room_types.map((r) => r.price));
  };

  const filtered = properties.filter((p) => {
    const matchesSearch =
      p.property_name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase()) ||
      (p.location || "").toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || p.property_type === typeFilter;
    const minPrice = getMinPrice(p);
    const matchesPrice = !minPrice || minPrice <= maxPrice;
    const matchesFacilities =
      facilityFilter.length === 0 ||
      facilityFilter.every((f) => (p.facilities || []).includes(f));
    return matchesSearch && matchesType && matchesPrice && matchesFacilities;
  });

  const toggleFacility = (f: string) => {
    setFacilityFilter((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const activeFilterCount =
    (typeFilter !== "all" ? 1 : 0) +
    (maxPrice < 500000 ? 1 : 0) +
    facilityFilter.length;

  const PropertyCard = ({ p, index }: { p: PropertyWithRooms; index: number }) => {
    const minPrice = getMinPrice(p);
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <Link key={p.id} to={`/property/${p.id}`}>
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:glow-primary cursor-pointer h-full card-elevated group">
            <div className="relative">
              <PropertyCarousel photos={p.photos || []} alt={p.property_name} />
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                <Badge variant="outline" className="bg-card/80 backdrop-blur-sm text-foreground border-border capitalize shadow-sm">
                  {p.property_type}
                </Badge>
                <VerificationBadge status={p.verification_status} />
              </div>
              {user && (
                <button
                  onClick={(e) => toggleSave(p.id, e)}
                  disabled={savingId === p.id}
                  className="absolute top-3 right-3 z-10 p-2 rounded-full bg-card/60 backdrop-blur-sm hover:bg-card/90 transition-colors shadow-sm"
                >
                  <Heart className={`h-4 w-4 ${savedIds.has(p.id) ? "fill-destructive text-destructive" : "text-foreground"}`} />
                </button>
              )}
              {minPrice && (
                <div className="absolute bottom-3 left-3 z-10">
                  <span className="rounded-lg bg-card/90 backdrop-blur-sm px-3 py-1.5 font-display text-sm font-bold text-foreground shadow-sm">
                    From ₦{minPrice.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/yr</span>
                  </span>
                </div>
              )}
            </div>
            <CardContent className="pt-4">
              <h3 className="mb-1 font-display text-lg font-semibold group-hover:text-primary transition-colors">{p.property_name}</h3>
              <div className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />{p.address}
              </div>
              <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-primary" />
                  {p.available_rooms}/{p.total_rooms} rooms
                </span>
                {p.distance_to_campus_km && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Navigation className="h-3.5 w-3.5" />
                    {p.distance_to_campus_km}km
                  </span>
                )}
                {(p as any).walkability_rating && (
                  <span className="flex items-center gap-0.5">
                    <Footprints className="h-3.5 w-3.5 text-muted-foreground" />
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`h-3 w-3 ${s <= (p as any).walkability_rating ? "fill-warning text-warning" : "text-muted-foreground/20"}`} />
                    ))}
                  </span>
                )}
              </div>
              {p.facilities && p.facilities.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {p.facilities.slice(0, 4).map((f) => (
                    <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                  ))}
                  {p.facilities.length > 4 && (
                    <Badge variant="secondary" className="text-xs">+{p.facilities.length - 4}</Badge>
                  )}
                </div>
              )}
              {p.room_types && p.room_types.length > 0 && (
                <div className="border-t border-border pt-2 mt-2">
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
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    );
  };

  // Loading skeletons
  const PropertySkeleton = () => (
    <Card className="overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <CardContent className="pt-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container py-8 flex-1">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Browse Properties</h1>
          <p className="text-muted-foreground">Verified accommodations near you</p>
        </div>

        {/* Search + Filter Toggle */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1" data-tour="properties-search">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, address, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              maxLength={100}
            />
          </div>
          <Button data-tour="properties-filters"
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "gradient-primary text-primary-foreground" : ""}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-2 gradient-accent text-accent-foreground text-xs h-5 min-w-5">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          {user && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon"><Bell className="h-4 w-4" /></Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <SavedSearchManager />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Property Type</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="shared">Shared</SelectItem>
                      <SelectItem value="hostel">Hostel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">
                    Max Price: <span className="text-primary font-bold">₦{maxPrice.toLocaleString()}</span>
                  </label>
                  <Slider value={[maxPrice]} onValueChange={([v]) => setMaxPrice(v)} min={10000} max={500000} step={5000} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>₦10,000</span><span>₦500,000</span>
                  </div>
                </div>
              </div>
              {allFacilities.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Facilities</label>
                  <div className="flex flex-wrap gap-2">
                    {allFacilities.map((f) => (
                      <button key={f} onClick={() => toggleFacility(f)}
                        className={`rounded-full px-3 py-1 text-xs transition-colors ${facilityFilter.includes(f) ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => { setTypeFilter("all"); setMaxPrice(500000); setFacilityFilter([]); }} className="text-destructive">
                  <X className="mr-1 h-3 w-3" /> Clear all filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <p className="mb-4 text-sm text-muted-foreground">
          {loading ? "Loading..." : `${filtered.length} ${filtered.length === 1 ? "property" : "properties"} found`}
          {savedIds.size > 0 && (
            <span className="ml-2">· <Heart className="inline h-3 w-3 fill-destructive text-destructive" /> {savedIds.size} saved</span>
          )}
        </p>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <PropertySkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No properties found. Try adjusting your filters.</p>
          </div>
        ) : (
          <Tabs defaultValue="list">
            <TabsList className="mb-4" data-tour="properties-views">
              <TabsTrigger value="list"><List className="mr-2 h-4 w-4" />List</TabsTrigger>
              <TabsTrigger value="map"><Map className="mr-2 h-4 w-4" />Map</TabsTrigger>
              {savedIds.size > 0 && (
                <TabsTrigger value="saved"><Heart className="mr-2 h-4 w-4" />Saved ({savedIds.size})</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="list">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p, i) => <PropertyCard key={p.id} p={p} index={i} />)}
              </div>
            </TabsContent>

            <TabsContent value="map">
              <PropertyMap properties={filtered} />
            </TabsContent>

            {savedIds.size > 0 && (
              <TabsContent value="saved">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filtered.filter((p) => savedIds.has(p.id)).map((p, i) => <PropertyCard key={p.id} p={p} index={i} />)}
                </div>
                {filtered.filter((p) => savedIds.has(p.id)).length === 0 && (
                  <div className="text-center py-12">
                    <Heart className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">No saved properties match your current filters.</p>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        )}
      </main>
      <Footer />
      <PropertiesTour />
    </div>
  );
}
