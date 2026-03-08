import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Banknote, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface ClientRent {
  id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  payment_method: string | null;
  property_name: string;
}

export function ClientRentPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<ClientRent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchRent = async () => {
      // Get client profile to find tenant_name match
      const { data: client } = await supabase
        .from("clients")
        .select("full_name, phone")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!client) { setLoading(false); return; }

      // Find rent payments matching this tenant by name
      const { data } = await supabase
        .from("rent_payments")
        .select("*, properties(property_name)")
        .ilike("tenant_name", client.full_name)
        .order("due_date", { ascending: false });

      const rows: ClientRent[] = (data || []).map((r: any) => ({
        id: r.id,
        amount: r.amount,
        due_date: r.due_date,
        paid_date: r.paid_date,
        status: r.status,
        payment_method: r.payment_method,
        property_name: r.properties?.property_name || "—",
      }));
      setPayments(rows);
      setLoading(false);
    };

    fetchRent();
  }, [user]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading rent info...</p>;
  if (payments.length === 0) return null;

  const totalOwed = payments.filter(p => p.status !== "paid").reduce((s, p) => s + p.amount, 0);
  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-semibold flex items-center gap-2">
        <Banknote className="h-5 w-5 text-primary" /> My Rent Payments
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2"><CheckCircle className="h-4 w-4 text-success" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Paid</p>
                <p className="text-lg font-bold text-success">₦{totalPaid.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2"><Clock className="h-4 w-4 text-warning" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="text-lg font-bold text-warning">₦{totalOwed.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{new Date(p.due_date).toLocaleDateString()}</TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
