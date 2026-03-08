import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Clock, AlertTriangle, Search, Download, Banknote } from "lucide-react";
import { toast } from "sonner";

interface RentRow {
  id: string;
  tenant_name: string;
  tenant_phone: string | null;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  payment_method: string | null;
  notes: string | null;
  property_name: string;
  property_id: string;
}

export function RentTrackingTab() {
  const [payments, setPayments] = useState<RentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchAll = async () => {
    const { data } = await supabase
      .from("rent_payments")
      .select("*, properties(property_name)")
      .order("due_date", { ascending: false });

    const rows: RentRow[] = (data || []).map((r: any) => ({
      id: r.id,
      tenant_name: r.tenant_name,
      tenant_phone: r.tenant_phone,
      amount: r.amount,
      due_date: r.due_date,
      paid_date: r.paid_date,
      status: r.status,
      payment_method: r.payment_method,
      notes: r.notes,
      property_name: r.properties?.property_name || "—",
      property_id: r.property_id,
    }));
    setPayments(rows);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const markAsPaid = async (id: string) => {
    const { error } = await supabase
      .from("rent_payments")
      .update({ status: "paid", paid_date: new Date().toISOString().split("T")[0] })
      .eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Marked as paid"); fetchAll(); }
  };

  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const totalOverdue = payments.filter(p => p.status === "overdue").reduce((s, p) => s + p.amount, 0);

  const filtered = payments.filter(p => {
    const matchesFilter = filter === "all" || p.status === filter;
    const matchesSearch = !search ||
      p.tenant_name.toLowerCase().includes(search.toLowerCase()) ||
      p.property_name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const exportCsv = () => {
    if (filtered.length === 0) { toast.error("No data to export"); return; }
    const headers = "Due Date,Tenant,Phone,Property,Amount,Status,Paid Date,Method,Notes";
    const rows = filtered.map(p =>
      [p.due_date, `"${p.tenant_name}"`, p.tenant_phone || "", `"${p.property_name}"`, p.amount, p.status, p.paid_date || "", p.payment_method || "", `"${(p.notes || "").replace(/"/g, '""')}"`].join(",")
    );
    const blob = new Blob([headers + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `all_rent_payments_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported");
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2.5"><CheckCircle className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Received</p>
                <p className="text-2xl font-bold text-success">₦{totalPaid.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2.5"><Clock className="h-5 w-5 text-warning" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning">₦{totalPending.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-destructive">₦{totalOverdue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "paid", "overdue"].map(s => (
            <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)} className="capitalize">{s}</Button>
          ))}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tenant or property..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Button size="sm" variant="outline" onClick={exportCsv}><Download className="mr-1 h-4 w-4" />Export</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Banknote className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No rent payments found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>All Rent Payments ({filtered.length})</CardTitle></CardHeader>
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
                    <TableHead>Paid Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{p.tenant_name}</p>
                          {p.tenant_phone && <p className="text-xs text-muted-foreground">{p.tenant_phone}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{p.property_name}</TableCell>
                      <TableCell className="font-semibold">₦{p.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          p.status === "paid" ? "bg-success/10 text-success" :
                          p.status === "overdue" ? "bg-destructive/10 text-destructive" :
                          "bg-warning/10 text-warning"
                        }>{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{p.paid_date ? new Date(p.paid_date).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        {p.status !== "paid" && (
                          <Button size="sm" variant="outline" onClick={() => markAsPaid(p.id)}>
                            <CheckCircle className="mr-1 h-3.5 w-3.5" />Paid
                          </Button>
                        )}
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
