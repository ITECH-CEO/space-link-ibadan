import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import {
  Building2, MapPin, Banknote, DoorOpen, CalendarDays, Users,
  Home, FileText, Wrench, ArrowLeft, CheckCircle2, Clock, AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

interface OccupancyDetail {
  id: string;
  property_id: string;
  property_name: string;
  property_address: string;
  room_type_name: string | null;
  room_type_price: number | null;
  room_type_features: string[] | null;
  status: string;
  rent_status: string;
  move_in_date: string;
  move_out_date: string | null;
  landlord_name: string;
  landlord_phone: string | null;
  landlord_email: string | null;
}

interface LeaseInfo {
  id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  security_deposit: number | null;
  payment_frequency: string;
  status: string;
  custom_terms: string[] | null;
  access_token: string | null;
}

interface PaymentRecord {
  id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  payment_method: string | null;
}

interface MaintenanceRecord {
  id: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  notes: string | null;
}

export default function MyAccommodation() {
  const { user, loading: authLoading } = useAuth();
  const [occupancies, setOccupancies] = useState<OccupancyDetail[]>([]);
  const [leases, setLeases] = useState<LeaseInfo[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: client } = await (supabase as any)
        .from("clients")
        .select("id, full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!client) { setLoading(false); return; }
      setClientName(client.full_name || "");

      // Fetch occupancies
      const { data: occData } = await (supabase as any)
        .from("room_occupancies")
        .select("id, property_id, status, rent_status, move_in_date, move_out_date, room_type_id, properties(property_name, address, landlord_name, landlord_phone, landlord_email), room_types(name, price, features)")
        .eq("client_id", client.id)
        .in("status", ["occupied", "at_risk"])
        .order("move_in_date", { ascending: false });

      const mapped = (occData || []).map((o: any) => ({
        id: o.id,
        property_id: o.property_id,
        property_name: o.properties?.property_name || "Unknown",
        property_address: o.properties?.address || "",
        room_type_name: o.room_types?.name || null,
        room_type_price: o.room_types?.price || null,
        room_type_features: o.room_types?.features || null,
        status: o.status,
        rent_status: o.rent_status,
        move_in_date: o.move_in_date,
        move_out_date: o.move_out_date,
        landlord_name: o.properties?.landlord_name || "—",
        landlord_phone: o.properties?.landlord_phone || null,
        landlord_email: o.properties?.landlord_email || null,
      }));
      setOccupancies(mapped);

      if (mapped.length > 0) {
        const propIds = mapped.map((o: OccupancyDetail) => o.property_id);

        // Fetch leases
        const { data: leaseData } = await (supabase as any)
          .from("lease_agreements")
          .select("id, start_date, end_date, rent_amount, security_deposit, payment_frequency, status, custom_terms, access_token")
          .in("property_id", propIds)
          .ilike("tenant_name", `%${client.full_name}%`)
          .order("created_at", { ascending: false });
        setLeases(leaseData || []);

        // Fetch payments
        const { data: payData } = await (supabase as any)
          .from("rent_payments")
          .select("id, amount, due_date, paid_date, status, payment_method")
          .in("property_id", propIds)
          .ilike("tenant_name", `%${client.full_name}%`)
          .order("due_date", { ascending: false });
        setPayments(payData || []);

        // Fetch maintenance requests
        const { data: maintData } = await (supabase as any)
          .from("maintenance_requests")
          .select("id, description, priority, status, created_at, notes")
          .in("property_id", propIds)
          .ilike("tenant_name", `%${client.full_name}%`)
          .order("created_at", { ascending: false });
        setMaintenance(maintData || []);
      }

      setLoading(false);
    })();
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const priorityColor: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-warning/10 text-warning border-warning/20",
    high: "bg-destructive/10 text-destructive border-destructive/20",
    urgent: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const paymentStatusIcon = (status: string) => {
    if (status === "paid") return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (status === "overdue") return <AlertTriangle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-warning" />;
  };

  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalOwed = payments.filter(p => p.status !== "paid").reduce((s, p) => s + p.amount, 0);
  const openMaint = maintenance.filter(m => m.status !== "resolved" && m.status !== "closed").length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-4xl py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Link to="/my-matches" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-3 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <h1 className="font-display text-3xl font-bold flex items-center gap-3">
            <Home className="h-7 w-7 text-primary" /> My Accommodation
          </h1>
          <p className="text-muted-foreground">Full details of your room, lease, payments, and maintenance history</p>
        </motion.div>

        {loading ? (
          <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}</div>
        ) : occupancies.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="py-16 text-center">
              <Home className="mx-auto h-16 w-16 text-muted-foreground/20 mb-4" />
              <h2 className="text-lg font-semibold mb-2">No Active Accommodation</h2>
              <p className="text-muted-foreground mb-4">You'll see your accommodation details here once you have an accepted match.</p>
              <Link to="/properties">
                <Button className="gradient-primary text-primary-foreground">Browse Properties</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
            {/* Summary Stats */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Active Rooms" value={occupancies.length.toString()} icon={DoorOpen} color="text-primary" />
              <StatCard label="Total Paid" value={`₦${totalPaid.toLocaleString()}`} icon={CheckCircle2} color="text-success" />
              <StatCard label="Outstanding" value={`₦${totalOwed.toLocaleString()}`} icon={Banknote} color={totalOwed > 0 ? "text-destructive" : "text-muted-foreground"} />
              <StatCard label="Open Issues" value={openMaint.toString()} icon={Wrench} color={openMaint > 0 ? "text-warning" : "text-muted-foreground"} />
            </motion.div>

            {/* Room Cards */}
            {occupancies.map((occ) => (
              <motion.div key={occ.id} variants={fadeUp}>
                <Card className="border-primary/20 card-elevated overflow-hidden">
                  <div className="h-1.5 w-full gradient-primary" />
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="h-5 w-5 text-primary" />
                          <h3 className="font-display font-bold text-lg">{occ.property_name}</h3>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {occ.property_address}
                        </div>
                      </div>
                      <Badge variant="outline" className={
                        occ.status === "occupied" ? "bg-success/10 text-success border-success/20" :
                        "bg-warning/10 text-warning border-warning/20"
                      }>
                        {occ.status === "occupied" ? "Active" : "At Risk"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {occ.room_type_name && (
                        <InfoTile icon={DoorOpen} label="Room Type" value={occ.room_type_name} />
                      )}
                      {occ.room_type_price && (
                        <InfoTile icon={Banknote} label="Rent" value={`₦${occ.room_type_price.toLocaleString()}`} highlight />
                      )}
                      <InfoTile icon={CalendarDays} label="Move-in" value={new Date(occ.move_in_date).toLocaleDateString()} />
                      <InfoTile icon={Banknote} label="Rent Status" value={occ.rent_status} badge={
                        occ.rent_status === "current" ? "bg-success/10 text-success" :
                        occ.rent_status === "overdue" ? "bg-destructive/10 text-destructive" :
                        "bg-warning/10 text-warning"
                      } />
                    </div>

                    {occ.room_type_features && occ.room_type_features.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Room Features</p>
                        <div className="flex flex-wrap gap-1.5">
                          {occ.room_type_features.map((f, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">{f}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Landlord */}
                    <div className="rounded-lg bg-muted/30 p-3 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Landlord</p>
                        <p className="text-sm font-medium">{occ.landlord_name}</p>
                        {occ.landlord_phone && <p className="text-xs text-muted-foreground">{occ.landlord_phone}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Tabs for Lease, Payments, Maintenance */}
            <motion.div variants={fadeUp}>
              <Tabs defaultValue="lease">
                <TabsList className="mb-4 flex-wrap">
                  <TabsTrigger value="lease"><FileText className="mr-2 h-4 w-4" />Lease ({leases.length})</TabsTrigger>
                  <TabsTrigger value="payments"><Banknote className="mr-2 h-4 w-4" />Payments ({payments.length})</TabsTrigger>
                  <TabsTrigger value="maintenance"><Wrench className="mr-2 h-4 w-4" />Issues ({maintenance.length})</TabsTrigger>
                </TabsList>

                {/* LEASE TAB */}
                <TabsContent value="lease">
                  {leases.length === 0 ? (
                    <Card className="card-elevated"><CardContent className="py-10 text-center">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground/20 mb-3" />
                      <p className="text-muted-foreground">No lease agreements found for your accommodation.</p>
                    </CardContent></Card>
                  ) : (
                    <div className="space-y-3">
                      {leases.map(lease => (
                        <Card key={lease.id} className="card-elevated border-border/50">
                          <CardContent className="p-5 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" /> Lease Agreement
                              </h4>
                              <Badge variant="outline" className={
                                lease.status === "active" ? "bg-success/10 text-success border-success/20" :
                                lease.status === "draft" ? "bg-muted text-muted-foreground" :
                                "bg-warning/10 text-warning border-warning/20"
                              }>
                                {lease.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                              <div><p className="text-xs text-muted-foreground">Start</p><p className="font-medium">{new Date(lease.start_date).toLocaleDateString()}</p></div>
                              <div><p className="text-xs text-muted-foreground">End</p><p className="font-medium">{new Date(lease.end_date).toLocaleDateString()}</p></div>
                              <div><p className="text-xs text-muted-foreground">Rent</p><p className="font-medium text-primary">₦{lease.rent_amount.toLocaleString()}</p></div>
                              <div><p className="text-xs text-muted-foreground">Frequency</p><p className="font-medium capitalize">{lease.payment_frequency}</p></div>
                            </div>
                            {lease.security_deposit && lease.security_deposit > 0 && (
                              <p className="text-xs text-muted-foreground">Security Deposit: <span className="font-medium text-foreground">₦{lease.security_deposit.toLocaleString()}</span></p>
                            )}
                            {lease.custom_terms && lease.custom_terms.length > 0 && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Terms</p>
                                <ul className="text-xs space-y-0.5 text-muted-foreground">
                                  {lease.custom_terms.map((t, i) => <li key={i}>• {t}</li>)}
                                </ul>
                              </div>
                            )}
                            {lease.access_token && (
                              <Link to={`/lease?token=${lease.access_token}`}>
                                <Button variant="outline" size="sm" className="mt-1">
                                  <FileText className="mr-2 h-3 w-3" /> View Full Lease
                                </Button>
                              </Link>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* PAYMENTS TAB */}
                <TabsContent value="payments">
                  {payments.length === 0 ? (
                    <Card className="card-elevated"><CardContent className="py-10 text-center">
                      <Banknote className="mx-auto h-12 w-12 text-muted-foreground/20 mb-3" />
                      <p className="text-muted-foreground">No payment records found.</p>
                    </CardContent></Card>
                  ) : (
                    <div className="space-y-2">
                      {payments.map(p => (
                        <Card key={p.id} className="card-elevated border-border/50">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {paymentStatusIcon(p.status)}
                              <div>
                                <p className="text-sm font-medium">₦{p.amount.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">
                                  Due: {new Date(p.due_date).toLocaleDateString()}
                                  {p.paid_date && ` • Paid: ${new Date(p.paid_date).toLocaleDateString()}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {p.payment_method && <span className="text-xs text-muted-foreground capitalize">{p.payment_method}</span>}
                              <Badge variant="outline" className={
                                p.status === "paid" ? "bg-success/10 text-success border-success/20" :
                                p.status === "overdue" ? "bg-destructive/10 text-destructive border-destructive/20" :
                                "bg-warning/10 text-warning border-warning/20"
                              }>
                                {p.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* MAINTENANCE TAB */}
                <TabsContent value="maintenance">
                  {maintenance.length === 0 ? (
                    <Card className="card-elevated"><CardContent className="py-10 text-center">
                      <Wrench className="mx-auto h-12 w-12 text-muted-foreground/20 mb-3" />
                      <p className="text-muted-foreground">No maintenance requests found.</p>
                    </CardContent></Card>
                  ) : (
                    <div className="space-y-2">
                      {maintenance.map(m => (
                        <Card key={m.id} className="card-elevated border-border/50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-1">
                              <p className="text-sm font-medium flex-1">{m.description}</p>
                              <div className="flex items-center gap-2 ml-2">
                                <Badge variant="outline" className={priorityColor[m.priority] || ""}>{m.priority}</Badge>
                                <Badge variant="outline" className={
                                  m.status === "resolved" || m.status === "closed" ? "bg-success/10 text-success border-success/20" :
                                  m.status === "in_progress" ? "bg-primary/10 text-primary border-primary/20" :
                                  "bg-warning/10 text-warning border-warning/20"
                                }>
                                  {m.status.replace("_", " ")}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Submitted {new Date(m.created_at).toLocaleDateString()}
                            </p>
                            {m.notes && <p className="text-xs text-muted-foreground mt-1 italic">Note: {m.notes}</p>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          </motion.div>
        )}
      </main>
      <WhatsAppButton />
    </div>
  );
}

/* Stat Card */
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <Card className="card-elevated border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`h-4 w-4 ${color}`} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className={`text-lg font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

/* Info Tile */
function InfoTile({ icon: Icon, label, value, highlight, badge }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string; highlight?: boolean; badge?: string;
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <Icon className="h-3 w-3" /> {label}
      </div>
      {badge ? (
        <Badge variant="outline" className={badge}>{value}</Badge>
      ) : (
        <p className={`text-sm font-semibold ${highlight ? "text-primary" : ""}`}>{value}</p>
      )}
    </div>
  );
}
