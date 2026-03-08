import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Building2, Users, Handshake, Banknote, TrendingUp, CheckCircle } from "lucide-react";

interface Stats {
  totalProperties: number;
  totalClients: number;
  totalMatches: number;
  acceptedMatches: number;
  pendingMatches: number;
  totalCommissions: number;
  paidCommissions: number;
  totalRooms: number;
  availableRooms: number;
  occupancyRate: number;
  propertyTypeBreakdown: { name: string; value: number }[];
  matchStatusBreakdown: { name: string; value: number }[];
  revenueByMonth: { month: string; amount: number }[];
}

const COLORS = [
  "hsl(211 80% 42%)",
  "hsl(43 96% 56%)",
  "hsl(142 72% 40%)",
  "hsl(0 72% 51%)",
  "hsl(215 12% 50%)",
];

export function AnalyticsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [
        { data: properties },
        { data: clients },
        { data: matches },
        { data: commissions },
      ] = await Promise.all([
        supabase.from("properties").select("id, property_type, total_rooms, available_rooms"),
        supabase.from("clients").select("id"),
        supabase.from("matches").select("id, status, created_at"),
        supabase.from("commissions").select("id, amount, status, created_at"),
      ]);

      const props = properties || [];
      const cls = clients || [];
      const mts = matches || [];
      const cms = commissions || [];

      const totalRooms = props.reduce((s, p) => s + (p.total_rooms || 0), 0);
      const availableRooms = props.reduce((s, p) => s + (p.available_rooms || 0), 0);
      const occupiedRooms = totalRooms - availableRooms;

      // Property type breakdown
      const typeCounts: Record<string, number> = {};
      props.forEach((p) => { typeCounts[p.property_type] = (typeCounts[p.property_type] || 0) + 1; });
      const propertyTypeBreakdown = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

      // Match status breakdown
      const statusCounts: Record<string, number> = {};
      mts.forEach((m) => { statusCounts[m.status] = (statusCounts[m.status] || 0) + 1; });
      const matchStatusBreakdown = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

      // Revenue by month (last 6 months)
      const revenueMap: Record<string, number> = {};
      cms.filter((c) => c.status === "paid").forEach((c) => {
        const d = new Date(c.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        revenueMap[key] = (revenueMap[key] || 0) + Number(c.amount);
      });
      const sortedMonths = Object.keys(revenueMap).sort().slice(-6);
      const revenueByMonth = sortedMonths.map((m) => ({
        month: new Date(m + "-01").toLocaleDateString("en", { month: "short", year: "2-digit" }),
        amount: revenueMap[m],
      }));

      setStats({
        totalProperties: props.length,
        totalClients: cls.length,
        totalMatches: mts.length,
        acceptedMatches: mts.filter((m) => m.status === "accepted").length,
        pendingMatches: mts.filter((m) => m.status === "pending").length,
        totalCommissions: cms.reduce((s, c) => s + Number(c.amount), 0),
        paidCommissions: cms.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0),
        totalRooms,
        availableRooms,
        occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
        propertyTypeBreakdown,
        matchStatusBreakdown,
        revenueByMonth,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <p className="text-muted-foreground">Loading analytics...</p>;
  if (!stats) return null;

  const kpis = [
    { label: "Properties", value: stats.totalProperties, icon: Building2, color: "text-primary" },
    { label: "Clients", value: stats.totalClients, icon: Users, color: "text-primary" },
    { label: "Matches", value: stats.totalMatches, icon: Handshake, color: "text-primary" },
    { label: "Accepted", value: stats.acceptedMatches, icon: CheckCircle, color: "text-success" },
    { label: "Occupancy", value: `${stats.occupancyRate}%`, icon: TrendingUp, color: "text-accent-foreground" },
    { label: "Revenue", value: `₦${stats.paidCommissions.toLocaleString()}`, icon: Banknote, color: "text-success" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-4 pb-4 text-center">
              <k.icon className={`mx-auto h-6 w-6 mb-1 ${k.color}`} />
              <p className="text-2xl font-bold">{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            {stats.revenueByMonth.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No revenue data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.revenueByMonth}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `₦${v.toLocaleString()}`} />
                  <Bar dataKey="amount" fill="hsl(211 80% 42%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Property Type Pie */}
        <Card>
          <CardHeader><CardTitle className="text-base">Property Types</CardTitle></CardHeader>
          <CardContent>
            {stats.propertyTypeBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No properties yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats.propertyTypeBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {stats.propertyTypeBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Match Status Pie */}
        <Card>
          <CardHeader><CardTitle className="text-base">Match Status Distribution</CardTitle></CardHeader>
          <CardContent>
            {stats.matchStatusBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No matches yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats.matchStatusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {stats.matchStatusBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Occupancy Overview */}
        <Card>
          <CardHeader><CardTitle className="text-base">Room Occupancy</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8 py-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{stats.totalRooms - stats.availableRooms}</p>
                <p className="text-xs text-muted-foreground">Occupied</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-success">{stats.availableRooms}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{stats.totalRooms}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-4 mt-2">
              <div
                className="gradient-primary h-4 rounded-full transition-all"
                style={{ width: `${stats.occupancyRate}%` }}
              />
            </div>
            <p className="text-center mt-2 text-sm font-medium">{stats.occupancyRate}% Occupied</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
