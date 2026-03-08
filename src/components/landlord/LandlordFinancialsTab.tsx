import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Banknote, TrendingUp, AlertTriangle, CheckCircle, PieChart, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

interface LandlordFinancialsTabProps {
  selectedPropertyId: string;
}

export function LandlordFinancialsTab({ selectedPropertyId }: LandlordFinancialsTabProps) {
  const { user } = useAuth();
  const [rentPayments, setRentPayments] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: props } = await supabase
        .from("properties")
        .select("id, property_name")
        .eq("owner_user_id", user.id);

      if (!props || props.length === 0) { setLoading(false); return; }

      const propIds = selectedPropertyId === "all"
        ? props.map(p => p.id)
        : props.filter(p => p.id === selectedPropertyId).map(p => p.id);

      const propMap = new Map(props.map(p => [p.id, p.property_name]));

      const [{ data: rents }, { data: comms }] = await Promise.all([
        supabase.from("rent_payments").select("*").in("property_id", propIds).order("due_date", { ascending: false }),
        supabase.from("commissions").select("*").in("property_id", propIds).order("created_at", { ascending: false }),
      ]);

      setRentPayments((rents || []).map((r: any) => ({ ...r, property_name: propMap.get(r.property_id) || "—" })));
      setCommissions((comms || []).map((c: any) => ({ ...c, property_name: propMap.get(c.property_id) || "—" })));
      setLoading(false);
    };
    fetchData();
  }, [user, selectedPropertyId]);

  const totalRentCollected = rentPayments.filter(r => r.status === "paid").reduce((s, r) => s + r.amount, 0);
  const totalRentPending = rentPayments.filter(r => r.status === "pending").reduce((s, r) => s + r.amount, 0);
  const totalRentOverdue = rentPayments.filter(r => r.status === "overdue").reduce((s, r) => s + r.amount, 0);
  const totalCommissions = commissions.filter(c => c.status === "paid").reduce((s, c) => s + c.amount, 0);

  // Monthly chart data
  const monthlyData = (() => {
    const months = new Map<string, number>();
    rentPayments.filter(r => r.status === "paid" && r.paid_date).forEach(r => {
      const month = r.paid_date.substring(0, 7);
      months.set(month, (months.get(month) || 0) + r.amount);
    });
    return Array.from(months.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, amount]) => ({
        month: new Date(month + "-01").toLocaleDateString("en", { month: "short", year: "2-digit" }),
        amount,
      }));
  })();

  const pieData = [
    { name: "Collected", value: totalRentCollected, color: "hsl(var(--success))" },
    { name: "Pending", value: totalRentPending, color: "hsl(var(--warning))" },
    { name: "Overdue", value: totalRentOverdue, color: "hsl(var(--destructive))" },
  ].filter(d => d.value > 0);

  const exportFinancials = () => {
    const headers = "Type,Date,Tenant/Client,Property,Amount,Status";
    const rentRows = rentPayments.map(r =>
      `Rent,${r.due_date},"${r.tenant_name}","${r.property_name}",${r.amount},${r.status}`
    );
    const commRows = commissions.map(c =>
      `Commission,${c.created_at.split("T")[0]},"—","${c.property_name}",${c.amount},${c.status}`
    );
    const csv = headers + "\n" + [...rentRows, ...commRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financials_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported");
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2.5"><CheckCircle className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Rent Collected</p>
                <p className="text-2xl font-bold text-success">₦{totalRentCollected.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2.5"><TrendingUp className="h-5 w-5 text-warning" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning">₦{totalRentPending.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2.5"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">₦{totalRentOverdue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5"><Banknote className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Commissions Paid</p>
                <p className="text-2xl font-bold">₦{totalCommissions.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {monthlyData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Monthly Rent Collection</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => [`₦${value.toLocaleString()}`, "Amount"]} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {pieData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Rent Status Breakdown</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <RPieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
                </RPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Export & Recent */}
      <div className="flex justify-end">
        <button onClick={exportFinancials} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <Download className="h-4 w-4" /> Export Financial Report
        </button>
      </div>

      {/* Recent Rent Payments */}
      {rentPayments.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Rent Payments</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rentPayments.slice(0, 10).map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{new Date(p.due_date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{p.tenant_name}</TableCell>
                      <TableCell className="text-sm">{p.property_name}</TableCell>
                      <TableCell className="font-semibold">₦{p.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          p.status === "paid" ? "bg-success/10 text-success" :
                          p.status === "overdue" ? "bg-destructive/10 text-destructive" :
                          "bg-warning/10 text-warning"
                        }>{p.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
