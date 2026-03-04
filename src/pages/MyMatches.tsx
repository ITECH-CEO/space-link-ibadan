import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Handshake, Building2, MapPin, DollarSign, Users } from "lucide-react";

interface MatchWithDetails {
  id: string;
  status: string;
  compatibility_score: number | null;
  created_at: string;
  property_name: string;
  property_address: string;
  property_id: string;
  room_type_name: string | null;
  room_type_price: number | null;
}

interface RoommateMatchDetail {
  id: string;
  status: string;
  compatibility_score: number | null;
  ai_reasoning: string | null;
  partner_name: string;
  property_name: string | null;
}

export default function MyMatches() {
  const { user, loading: authLoading } = useAuth();
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [roommateMatches, setRoommateMatches] = useState<RoommateMatchDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      // Get client record
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!client) { setLoading(false); return; }

      // Property matches
      const { data: propData } = await supabase
        .from("matches")
        .select("id, status, compatibility_score, created_at, property_id, properties(property_name, address), room_types(name, price)")
        .eq("client_id", client.id)
        .order("compatibility_score", { ascending: false });

      setMatches((propData || []).map((m: any) => ({
        id: m.id,
        status: m.status,
        compatibility_score: m.compatibility_score,
        created_at: m.created_at,
        property_name: m.properties?.property_name || "—",
        property_address: m.properties?.address || "",
        property_id: m.property_id,
        room_type_name: m.room_types?.name || null,
        room_type_price: m.room_types?.price || null,
      })));

      // Roommate matches
      const { data: rmData } = await (supabase as any)
        .from("roommate_matches")
        .select("id, status, compatibility_score, ai_reasoning, client_a_id, client_b_id, properties(property_name)")
        .or(`client_a_id.eq.${client.id},client_b_id.eq.${client.id}`)
        .order("compatibility_score", { ascending: false });

      if (rmData && rmData.length > 0) {
        const partnerIds = rmData.map((r: any) =>
          r.client_a_id === client.id ? r.client_b_id : r.client_a_id
        );
        const { data: partners } = await supabase
          .from("clients")
          .select("id, full_name")
          .in("id", partnerIds);
        const pMap = new Map((partners || []).map(p => [p.id, p.full_name]));

        setRoommateMatches(rmData.map((r: any) => {
          const partnerId = r.client_a_id === client.id ? r.client_b_id : r.client_a_id;
          return {
            id: r.id,
            status: r.status,
            compatibility_score: r.compatibility_score,
            ai_reasoning: r.ai_reasoning,
            partner_name: pMap.get(partnerId) || "—",
            property_name: r.properties?.property_name || null,
          };
        }));
      }

      setLoading(false);
    };

    fetchAll();
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const statusColors: Record<string, string> = {
    pending: "bg-warning/10 text-warning border-warning/20",
    accepted: "bg-success/10 text-success border-success/20",
    rejected: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const scoreClass = (s: number | null) =>
    (s ?? 0) >= 70 ? "text-success" : (s ?? 0) >= 50 ? "text-warning" : "text-muted-foreground";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-3xl py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold">My Matches</h1>
          <p className="text-muted-foreground">Properties and roommates matched to your profile</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
        ) : (
          <Tabs defaultValue="properties">
            <TabsList className="mb-4">
              <TabsTrigger value="properties"><Building2 className="mr-2 h-4 w-4" />Properties ({matches.length})</TabsTrigger>
              <TabsTrigger value="roommates"><Users className="mr-2 h-4 w-4" />Roommates ({roommateMatches.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="properties">
              {matches.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Handshake className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h2 className="text-lg font-semibold mb-2">No Property Matches Yet</h2>
                    <p className="text-muted-foreground mb-4">Complete your profile with budget and preferences.</p>
                    <Link to="/profile" className="text-primary underline">Complete your profile →</Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {matches.map((m) => (
                    <Link key={m.id} to={`/property/${m.property_id}`}>
                      <Card className="transition-shadow hover:shadow-lg cursor-pointer">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Building2 className="h-4 w-4 text-primary" />
                                <h3 className="font-semibold">{m.property_name}</h3>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                <MapPin className="h-3 w-3" /> {m.property_address}
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                {m.room_type_name && <Badge variant="secondary" className="text-xs">{m.room_type_name}</Badge>}
                                {m.room_type_price && (
                                  <span className="flex items-center gap-1 font-medium text-primary">
                                    <DollarSign className="h-3 w-3" />₦{m.room_type_price.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className={`text-lg font-bold ${scoreClass(m.compatibility_score)}`}>
                                {m.compatibility_score ?? 0}%
                              </div>
                              <Badge variant="outline" className={statusColors[m.status] || ""}>{m.status}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="roommates">
              {roommateMatches.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h2 className="text-lg font-semibold mb-2">No Roommate Matches Yet</h2>
                    <p className="text-muted-foreground">Our system will find compatible roommates for you soon.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {roommateMatches.map((r) => (
                    <Card key={r.id} className="transition-shadow hover:shadow-md">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="h-4 w-4 text-primary" />
                              <h3 className="font-semibold">{r.partner_name}</h3>
                            </div>
                            {r.property_name && (
                              <p className="text-sm text-muted-foreground mb-1">
                                <Building2 className="inline h-3 w-3 mr-1" />Shared interest: {r.property_name}
                              </p>
                            )}
                            {r.ai_reasoning && (
                              <p className="text-xs text-muted-foreground mt-2 italic">"{r.ai_reasoning}"</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className={`text-lg font-bold ${scoreClass(r.compatibility_score)}`}>
                              {r.compatibility_score ?? 0}%
                            </div>
                            <Badge variant="outline" className={statusColors[r.status] || ""}>{r.status}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}