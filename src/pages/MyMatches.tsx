import { useEffect, useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { toast } from "sonner";
import { Handshake, Building2, MapPin, Banknote, Users, Sparkles, Loader2, MessageSquare, LayoutGrid, Heart, CheckCheck, X } from "lucide-react";
import { RoommateSwipeCard } from "@/components/RoommateSwipeCard";
import { motion } from "framer-motion";
import { MatchesTour } from "@/components/tours/MatchesTour";
import { ClientRentPayments } from "@/components/ClientRentPayments";
import { ClientComplaintForm } from "@/components/ClientComplaintForm";
import { ClientComplaintTracker } from "@/components/ClientComplaintTracker";

interface MatchWithDetails {
  id: string; status: string; compatibility_score: number | null; created_at: string;
  property_name: string; property_address: string; property_id: string;
  room_type_name: string | null; room_type_price: number | null;
}

interface RoommateMatchDetail {
  id: string; status: string; compatibility_score: number | null;
  ai_reasoning: string | null; partner_name: string; property_name: string | null;
  partner_user_id?: string;
  partner_photo: string | null;
  partner_faculty: string | null;
  partner_course: string | null;
  partner_level: string | null;
  partner_preferences: string[] | null;
  my_status: "pending" | "accepted" | "rejected";
  partner_status: "pending" | "accepted" | "rejected";
  is_client_a: boolean;
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function MyMatches() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [roommateMatches, setRoommateMatches] = useState<RoommateMatchDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [seekingRoommate, setSeekingRoommate] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState<string | null>(null);
  const [swipeView, setSwipeView] = useState(false);

  const fetchAll = async () => {
    if (!user) return;
    const { data: client } = await (supabase as any)
      .from("clients").select("id, seeking_roommate, full_name, phone").eq("user_id", user.id).maybeSingle();
    if (!client) { setLoading(false); return; }
    setClientId(client.id);
    setSeekingRoommate(client.seeking_roommate || false);
    setClientName(client.full_name || "");
    setClientPhone(client.phone || null);

    const { data: propData } = await supabase
      .from("matches")
      .select("id, status, compatibility_score, created_at, property_id, properties(property_name, address), room_types(name, price)")
      .eq("client_id", client.id)
      .order("compatibility_score", { ascending: false });

    setMatches((propData || []).map((m: any) => ({
      id: m.id, status: m.status, compatibility_score: m.compatibility_score, created_at: m.created_at,
      property_name: m.properties?.property_name || "—", property_address: m.properties?.address || "",
      property_id: m.property_id, room_type_name: m.room_types?.name || null,
      room_type_price: m.room_types?.price || null,
    })));

    const { data: rmData } = await (supabase as any)
      .from("roommate_matches")
      .select("id, status, compatibility_score, ai_reasoning, client_a_id, client_b_id, client_a_status, client_b_status, properties(property_name)")
      .or(`client_a_id.eq.${client.id},client_b_id.eq.${client.id}`)
      .order("compatibility_score", { ascending: false });

    if (rmData && rmData.length > 0) {
      const partnerIds = rmData.map((r: any) => r.client_a_id === client.id ? r.client_b_id : r.client_a_id);
      const { data: partners } = await supabase
        .from("clients")
        .select("id, full_name, user_id, current_photo_url, faculty, course, level, preferences")
        .in("id", partnerIds);
      const pMap = new Map((partners || []).map(p => [p.id, p]));

      setRoommateMatches(rmData.map((r: any) => {
        const isClientA = r.client_a_id === client.id;
        const partnerId = isClientA ? r.client_b_id : r.client_a_id;
        const partner = pMap.get(partnerId);
        return {
          id: r.id, status: r.status, compatibility_score: r.compatibility_score,
          ai_reasoning: r.ai_reasoning, partner_name: partner?.full_name || "—",
          property_name: r.properties?.property_name || null,
          partner_user_id: partner?.user_id,
          partner_photo: partner?.current_photo_url || null,
          partner_faculty: partner?.faculty || null,
          partner_course: partner?.course || null,
          partner_level: partner?.level || null,
          partner_preferences: partner?.preferences || null,
          my_status: isClientA ? r.client_a_status : r.client_b_status,
          partner_status: isClientA ? r.client_b_status : r.client_a_status,
          is_client_a: isClientA,
        };
      }));
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const handleSwipeAction = async (matchId: string, action: "accepted" | "rejected") => {
    const match = roommateMatches.find(m => m.id === matchId);
    if (!match) return;

    const updateCol = match.is_client_a ? "client_a_status" : "client_b_status";
    const { error } = await (supabase as any)
      .from("roommate_matches")
      .update({ [updateCol]: action })
      .eq("id", matchId);

    if (error) {
      toast.error("Failed to save your choice");
      return;
    }

    // Check if mutual match
    if (action === "accepted" && match.partner_status === "accepted") {
      // Both accepted — update overall status to confirmed
      await (supabase as any)
        .from("roommate_matches")
        .update({ status: "confirmed" })
        .eq("id", matchId);
      toast.success(`🎉 It's a match! You and ${match.partner_name} both liked each other!`);
    } else if (action === "accepted") {
      toast.success("Liked! Waiting for their response...");
    } else {
      toast("Passed");
    }

    // Update local state
    setRoommateMatches(prev => prev.map(m => {
      if (m.id !== matchId) return m;
      const newMyStatus = action;
      const newOverallStatus = action === "accepted" && m.partner_status === "accepted" ? "confirmed" : m.status;
      return { ...m, my_status: newMyStatus, status: newOverallStatus };
    }));
  };

  const requestRoommateMatch = async () => {
    if (!clientId) { toast.error("Complete your profile first"); return; }

    // Check max 5 active (pending) matches
    const pendingCount = roommateMatches.filter(m => m.my_status === "pending").length;
    if (pendingCount >= 5) {
      toast.error("You have 5 pending matches. Review them first before requesting more.");
      return;
    }

    setRequesting(true);
    try {
      await (supabase as any).from("clients").update({ seeking_roommate: true }).eq("id", clientId);
      setSeekingRoommate(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Not authenticated"); return; }
      const res = await supabase.functions.invoke("roommate-match", { body: { client_id: clientId } });
      if (res.error) toast.error(res.error.message || "Matching failed");
      else {
        toast.success(res.data?.message || "Roommate match request submitted!");
        await fetchAll();
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setRequesting(false);
    }
  };

  const messageRoommate = (partnerUserId: string) => {
    navigate(`/messages?to=${partnerUserId}`);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-warning/10 text-warning border-warning/20",
    accepted: "bg-success/10 text-success border-success/20",
    confirmed: "bg-success/10 text-success border-success/20",
    rejected: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const scoreClass = (s: number | null) =>
    (s ?? 0) >= 70 ? "text-success" : (s ?? 0) >= 50 ? "text-warning" : "text-muted-foreground";

  // Separate confirmed matches vs pending
  const confirmedMatches = roommateMatches.filter(m => m.status === "confirmed");
  const pendingRoommates = roommateMatches.filter(m => m.status !== "confirmed" && m.my_status !== "rejected");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-3xl py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="font-display text-3xl font-bold">My Matches</h1>
          <p className="text-muted-foreground">Properties and roommates matched to your profile</p>
        </motion.div>

        {loading ? (
          <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
        ) : (
          <Tabs defaultValue="properties">
            <TabsList className="mb-4" data-tour="matches-tabs">
              <TabsTrigger value="properties"><Building2 className="mr-2 h-4 w-4" />Properties ({matches.length})</TabsTrigger>
              <TabsTrigger value="roommates"><Users className="mr-2 h-4 w-4" />Roommates ({roommateMatches.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="properties">
              {matches.length === 0 ? (
                <Card className="card-elevated border-border/50">
                  <CardContent className="py-12 text-center">
                    <Handshake className="mx-auto h-16 w-16 text-muted-foreground/20 mb-4" />
                    <h2 className="text-lg font-semibold mb-2">No Property Matches Yet</h2>
                    <p className="text-muted-foreground mb-4">Complete your profile with budget and preferences.</p>
                    <Link to="/profile" className="text-primary underline">Complete your profile →</Link>
                  </CardContent>
                </Card>
              ) : (
                <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
                  {matches.map((m) => (
                    <motion.div key={m.id} variants={fadeUp}>
                      <Card className="transition-all hover:shadow-lg hover:glow-primary card-elevated border-border/50">
                        <CardContent className="p-5">
                          <Link to={`/property/${m.property_id}`}>
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
                                      ₦{m.room_type_price.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <div className={`text-lg font-bold ${scoreClass(m.compatibility_score)}`}>{m.compatibility_score ?? 0}%</div>
                                <Badge variant="outline" className={statusColors[m.status] || ""}>{m.status}</Badge>
                              </div>
                            </div>
                          </Link>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="roommates">
              <Card className="mb-4 border-primary/20 card-elevated" data-tour="roommate-find">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">Find a Roommate</h3>
                      <p className="text-xs text-muted-foreground">
                        {seekingRoommate
                          ? "You're actively looking for roommates. We'll notify you when we find a match!"
                          : "Request AI-powered roommate matching based on your course, faculty, and preferences."}
                      </p>
                    </div>
                    <Button
                      onClick={requestRoommateMatch}
                      disabled={requesting}
                      size="sm"
                      className="gradient-primary text-primary-foreground"
                    >
                      {requesting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Finding...</>
                      ) : (
                        <><Sparkles className="mr-2 h-4 w-4" />{seekingRoommate ? "Re-match" : "Find Roommate"}</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Confirmed Matches Section */}
              {confirmedMatches.length > 0 && (
                <div className="mb-6">
                  <h3 className="flex items-center gap-2 font-display font-semibold text-sm mb-3 text-success">
                    <CheckCheck className="h-4 w-4" /> Confirmed Matches ({confirmedMatches.length})
                  </h3>
                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
                    {confirmedMatches.map((r) => (
                      <motion.div key={r.id} variants={fadeUp}>
                        <Card className="border-success/20 card-elevated">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                {r.partner_photo ? (
                                  <img src={r.partner_photo} alt={r.partner_name} className="h-12 w-12 rounded-full object-cover border-2 border-success/30" />
                                ) : (
                                  <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center border-2 border-success/30">
                                    <Users className="h-5 w-5 text-success" />
                                  </div>
                                )}
                                <div>
                                  <h3 className="font-semibold">{r.partner_name}</h3>
                                  {r.partner_faculty && <p className="text-xs text-muted-foreground">{r.partner_faculty} • {r.partner_course}</p>}
                                  {r.property_name && <p className="text-xs text-muted-foreground mt-0.5">📍 {r.property_name}</p>}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <div className={`text-lg font-bold ${scoreClass(r.compatibility_score)}`}>{r.compatibility_score ?? 0}%</div>
                                <Badge variant="outline" className="bg-success/10 text-success border-success/20">✓ Mutual Match</Badge>
                              </div>
                            </div>
                            {r.partner_user_id && (
                              <Button onClick={() => messageRoommate(r.partner_user_id!)} variant="outline" size="sm" className="mt-3 w-full">
                                <MessageSquare className="mr-2 h-4 w-4" /> Message {r.partner_name}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Pending / Swipeable Matches */}
              {pendingRoommates.length === 0 && confirmedMatches.length === 0 ? (
                <Card className="card-elevated border-border/50">
                  <CardContent className="py-12 text-center">
                    <Users className="mx-auto h-16 w-16 text-muted-foreground/20 mb-4" />
                    <h2 className="text-lg font-semibold mb-2">No Roommate Matches Yet</h2>
                    <p className="text-muted-foreground">Click "Find Roommate" above and make sure your profile has your course and faculty info.</p>
                  </CardContent>
                </Card>
              ) : pendingRoommates.length > 0 && swipeView ? (
                <RoommateSwipeCard
                  matches={pendingRoommates}
                  onMessage={(userId) => messageRoommate(userId)}
                  onBack={() => setSwipeView(false)}
                  onSwipeAction={handleSwipeAction}
                />
              ) : pendingRoommates.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-semibold text-sm text-muted-foreground">
                      Pending ({pendingRoommates.filter(m => m.my_status === "pending").length} to review)
                    </h3>
                    <Button variant="outline" size="sm" onClick={() => setSwipeView(true)} className="text-sm" data-tour="roommate-swipe">
                      <LayoutGrid className="mr-2 h-4 w-4" /> Swipe View
                    </Button>
                  </div>
                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
                    {pendingRoommates.map((r) => (
                      <motion.div key={r.id} variants={fadeUp}>
                        <Card className="transition-all hover:shadow-md card-elevated border-border/50">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                {r.partner_photo ? (
                                  <img src={r.partner_photo} alt={r.partner_name} className="h-10 w-10 rounded-full object-cover" />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <h3 className="font-semibold">{r.partner_name}</h3>
                                  {r.partner_faculty && <p className="text-xs text-muted-foreground">{r.partner_faculty}{r.partner_course ? ` • ${r.partner_course}` : ""}</p>}
                                  {r.property_name && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      <Building2 className="inline h-3 w-3 mr-1" />Shared interest: {r.property_name}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <div className={`text-lg font-bold ${scoreClass(r.compatibility_score)}`}>{r.compatibility_score ?? 0}%</div>
                                <Badge variant="outline" className={statusColors[r.my_status] || ""}>
                                  {r.my_status === "accepted" ? "You liked" : r.my_status}
                                </Badge>
                              </div>
                            </div>

                            {/* Action buttons for pending */}
                            {r.my_status === "pending" && (
                              <div className="flex gap-2 mt-3">
                                <Button
                                  onClick={() => handleSwipeAction(r.id, "rejected")}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                                >
                                  <X className="mr-1 h-4 w-4" /> Pass
                                </Button>
                                <Button
                                  onClick={() => handleSwipeAction(r.id, "accepted")}
                                  size="sm"
                                  className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                                >
                                  <Heart className="mr-1 h-4 w-4" /> Like
                                </Button>
                              </div>
                            )}

                            {r.my_status === "accepted" && r.partner_user_id && (
                              <Button onClick={() => messageRoommate(r.partner_user_id!)} variant="outline" size="sm" className="mt-3 w-full">
                                <MessageSquare className="mr-2 h-4 w-4" /> Message {r.partner_name}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </>
              ) : null}
            </TabsContent>
          </Tabs>
        )}

        {/* Complaint Button */}
        {matches.filter(m => m.status === "accepted").length > 0 && (
          <div className="mt-6 flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card">
            <div>
              <h3 className="font-semibold text-sm">Having an issue with your accommodation?</h3>
              <p className="text-xs text-muted-foreground">Report maintenance problems to your landlord</p>
            </div>
            <ClientComplaintForm
              matchedProperties={matches.filter(m => m.status === "accepted").map(m => ({ property_id: m.property_id, property_name: m.property_name }))}
              clientName={clientName}
              clientPhone={clientPhone}
            />
          </div>
        )}

        {/* Rent Payments Section */}
        <div className="mt-8">
          <ClientRentPayments />
        </div>
      </main>
      <WhatsAppButton />
      <MatchesTour />
    </div>
  );
}
