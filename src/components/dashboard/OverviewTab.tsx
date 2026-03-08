import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Handshake, DollarSign, TrendingUp, Clock, CheckCircle, AlertTriangle, ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

interface KPI {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color: string;
  bgColor: string;
}

interface ActivityItem {
  id: string;
  type: "property" | "client" | "match" | "commission" | "inspection";
  title: string;
  detail: string;
  time: string;
  status?: string;
}

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 20, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } } },
};

const feedStagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.25 } } },
  item: { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0, transition: { duration: 0.25 } } },
};

export function OverviewTab() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [
        { data: properties }, { data: clients }, { data: matches },
        { data: commissions }, { data: inspections },
      ] = await Promise.all([
        supabase.from("properties").select("id, verification_status, created_at, property_name, total_rooms, available_rooms"),
        supabase.from("clients").select("id, verification_status, created_at, full_name"),
        supabase.from("matches").select("id, status, created_at"),
        supabase.from("commissions").select("id, amount, status, created_at"),
        supabase.from("inspection_bookings").select("id, status, created_at, payment_status"),
      ]);

      const props = properties || [];
      const cls = clients || [];
      const mts = matches || [];
      const cms = commissions || [];
      const insp = inspections || [];

      const pendingProps = props.filter(p => p.verification_status === "pending").length;
      const pendingClients = cls.filter(c => c.verification_status === "pending").length;
      const revenue = cms.filter(c => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0);
      const totalRooms = props.reduce((s, p) => s + (p.total_rooms || 0), 0);
      const availableRooms = props.reduce((s, p) => s + (p.available_rooms || 0), 0);
      const occupancy = totalRooms > 0 ? Math.round(((totalRooms - availableRooms) / totalRooms) * 100) : 0;

      setKpis([
        { label: "Properties", value: props.length, icon: Building2, color: "text-primary", bgColor: "bg-primary/10", trend: `${pendingProps} pending` },
        { label: "Clients", value: cls.length, icon: Users, color: "text-accent", bgColor: "bg-accent/10", trend: `${pendingClients} unverified` },
        { label: "Matches", value: mts.filter(m => m.status === "accepted").length, icon: Handshake, color: "text-success", bgColor: "bg-success/10", trend: `${mts.filter(m => m.status === "pending").length} pending` },
        { label: "Revenue", value: `₦${revenue.toLocaleString()}`, icon: DollarSign, color: "text-primary", bgColor: "bg-primary/10", trend: `${cms.filter(c => c.status === "pending").length} unpaid` },
        { label: "Occupancy", value: `${occupancy}%`, icon: TrendingUp, color: "text-success", bgColor: "bg-success/10" },
        { label: "Inspections", value: insp.length, icon: Clock, color: "text-accent", bgColor: "bg-accent/10", trend: `${insp.filter(i => i.status === "confirmed").length} upcoming` },
      ]);

      const items: ActivityItem[] = [];
      props.slice(0, 8).forEach(p => items.push({
        id: p.id, type: "property", title: p.property_name,
        detail: p.verification_status === "pending" ? "Awaiting approval" : `${p.verification_status}`,
        time: p.created_at, status: p.verification_status,
      }));
      cls.slice(0, 8).forEach(c => items.push({
        id: c.id, type: "client", title: c.full_name,
        detail: c.verification_status === "pending" ? "Needs verification" : `${c.verification_status}`,
        time: c.created_at, status: c.verification_status,
      }));
      mts.slice(0, 5).forEach(m => items.push({
        id: m.id, type: "match", title: "New Match",
        detail: m.status, time: m.created_at, status: m.status,
      }));
      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivity(items.slice(0, 15));
      setLoading(false);
    };
    fetchData();

    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "properties" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "commissions" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const typeIcons: Record<string, React.ElementType> = {
    property: Building2, client: Users, match: Handshake, commission: DollarSign, inspection: Clock,
  };

  const typeColors: Record<string, string> = {
    property: "bg-primary/10 text-primary",
    client: "bg-accent/10 text-accent",
    match: "bg-success/10 text-success",
    commission: "bg-primary/10 text-primary",
    inspection: "bg-accent/10 text-accent",
  };

  const statusColor = (s?: string) => {
    if (s === "approved" || s === "accepted" || s === "paid") return "bg-success/10 text-success border-success/20";
    if (s === "rejected") return "bg-destructive/10 text-destructive border-destructive/20";
    return "bg-muted text-muted-foreground border-border";
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6 pb-5">
                <div className="h-11 w-11 rounded-xl bg-muted mb-4" />
                <div className="h-7 w-16 bg-muted rounded mb-2" />
                <div className="h-3 w-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <motion.div
        className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6"
        variants={stagger.container}
        initial="hidden"
        animate="show"
      >
        {kpis.map((k) => (
          <motion.div key={k.label} variants={stagger.item}>
            <Card className="card-elevated relative overflow-hidden group hover:card-premium transition-all duration-300 h-full cursor-default">
              <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-[3rem] opacity-[0.04] group-hover:opacity-[0.08] transition-opacity" style={{background: "currentColor"}} />
              <CardContent className="pt-6 pb-5 relative">
                <div className={`h-11 w-11 rounded-xl ${k.bgColor} flex items-center justify-center mb-4`}>
                  <k.icon className={`h-5 w-5 ${k.color}`} />
                </div>
                <p className="text-2xl font-display font-bold tracking-tight">{k.value}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
                  {k.trend && (
                    <span className="text-[10px] text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded-full">{k.trend}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Pending + Activity */}
      <motion.div
        className="grid gap-6 lg:grid-cols-2"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.45 }}
      >
        {/* Needs Attention */}
        <Card className="card-elevated">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-3.5 w-3.5 text-warning" />
              </div>
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.filter(a => a.status === "pending").length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <span className="text-sm font-medium">All caught up!</span>
              </div>
            ) : (
              <motion.div className="space-y-2 max-h-[360px] overflow-y-auto pr-1" variants={feedStagger.container} initial="hidden" animate="show">
                {activity.filter(a => a.status === "pending").map((item) => {
                  const Icon = typeIcons[item.type] || Clock;
                  return (
                    <motion.div key={item.id} variants={feedStagger.item} className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/40 transition-all duration-200 group">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${typeColors[item.type]}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="card-elevated">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5 text-primary" />
              </div>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div className="space-y-1 max-h-[360px] overflow-y-auto pr-1" variants={feedStagger.container} initial="hidden" animate="show">
              {activity.map((item) => {
                const Icon = typeIcons[item.type] || Clock;
                return (
                  <motion.div key={item.id + item.type} variants={feedStagger.item} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${typeColors[item.type]}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 capitalize ${statusColor(item.status)}`}>
                      {item.status}
                    </Badge>
                  </motion.div>
                );
              })}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
