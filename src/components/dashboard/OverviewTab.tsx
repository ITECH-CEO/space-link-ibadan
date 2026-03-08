import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Handshake, DollarSign, TrendingUp, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

interface KPI {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color: string;
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
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 16, scale: 0.96 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: "easeOut" as const } } },
};

const feedStagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.2 } } },
  item: { hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { duration: 0.25 } } },
};

export function OverviewTab() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [
        { data: properties },
        { data: clients },
        { data: matches },
        { data: commissions },
        { data: inspections },
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
        { label: "Total Properties", value: props.length, icon: Building2, color: "text-primary", trend: `${pendingProps} pending` },
        { label: "Total Clients", value: cls.length, icon: Users, color: "text-primary", trend: `${pendingClients} unverified` },
        { label: "Active Matches", value: mts.filter(m => m.status === "accepted").length, icon: Handshake, color: "text-success", trend: `${mts.filter(m => m.status === "pending").length} pending` },
        { label: "Revenue", value: `₦${revenue.toLocaleString()}`, icon: DollarSign, color: "text-success", trend: `${cms.filter(c => c.status === "pending").length} unpaid` },
        { label: "Occupancy", value: `${occupancy}%`, icon: TrendingUp, color: "text-accent-foreground" },
        { label: "Inspections", value: insp.length, icon: Clock, color: "text-primary", trend: `${insp.filter(i => i.status === "confirmed").length} confirmed` },
      ]);

      const items: ActivityItem[] = [];
      props.slice(0, 8).forEach(p => items.push({
        id: p.id, type: "property", title: `Property: ${p.property_name}`,
        detail: p.verification_status === "pending" ? "Awaiting approval" : `Status: ${p.verification_status}`,
        time: p.created_at, status: p.verification_status,
      }));
      cls.slice(0, 8).forEach(c => items.push({
        id: c.id, type: "client", title: `Client: ${c.full_name}`,
        detail: c.verification_status === "pending" ? "Needs verification" : `Status: ${c.verification_status}`,
        time: c.created_at, status: c.verification_status,
      }));
      mts.slice(0, 5).forEach(m => items.push({
        id: m.id, type: "match", title: "New Match",
        detail: `Status: ${m.status}`, time: m.created_at, status: m.status,
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

  const statusColor = (s?: string) => {
    if (s === "approved" || s === "accepted" || s === "paid") return "bg-success/10 text-success border-success/20";
    if (s === "rejected") return "bg-destructive/10 text-destructive border-destructive/20";
    return "bg-muted text-muted-foreground border-border";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="card-elevated animate-pulse">
              <CardContent className="pt-5 pb-4">
                <div className="h-9 w-9 rounded-lg bg-muted mb-3" />
                <div className="h-6 w-16 bg-muted rounded mb-1" />
                <div className="h-3 w-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards with stagger animation */}
      <motion.div
        className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6"
        variants={stagger.container}
        initial="hidden"
        animate="show"
      >
        {kpis.map((k) => (
          <motion.div key={k.label} variants={stagger.item}>
            <Card className="card-elevated relative overflow-hidden group hover:glow-primary transition-all duration-300 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="pt-5 pb-4 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <k.icon className={`h-4 w-4 ${k.color}`} />
                  </div>
                  {k.trend && (
                    <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">{k.trend}</span>
                  )}
                </div>
                <p className="text-2xl font-bold tracking-tight font-display">{k.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Pending Actions + Activity Feed */}
      <motion.div
        className="grid gap-6 lg:grid-cols-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        {/* Pending Actions */}
        <Card className="card-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.filter(a => a.status === "pending").length === 0 ? (
              <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm">All caught up!</span>
              </div>
            ) : (
              <motion.div className="space-y-2 max-h-[320px] overflow-y-auto" variants={feedStagger.container} initial="hidden" animate="show">
                {activity.filter(a => a.status === "pending").map((item) => {
                  const Icon = typeIcons[item.type] || Clock;
                  return (
                    <motion.div key={item.id} variants={feedStagger.item} className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${statusColor(item.status)}`}>
                        {item.status}
                      </Badge>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="card-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div className="space-y-1 max-h-[320px] overflow-y-auto" variants={feedStagger.container} initial="hidden" animate="show">
              {activity.map((item) => {
                const Icon = typeIcons[item.type] || Clock;
                return (
                  <motion.div key={item.id + item.type} variants={feedStagger.item} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/30 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${statusColor(item.status)}`}>
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
