import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Banknote } from "lucide-react";

interface PaymentRow {
  id: string;
  commission_type: string;
  amount: number;
  status: string;
  created_at: string;
  client_name?: string;
  property_name?: string;
}

export function LandlordPaymentsTab() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      // Get landlord's property ids
      const { data: props } = await supabase
        .from("properties")
        .select("id")
        .eq("owner_user_id", user.id);

      if (!props || props.length === 0) {
        setLoading(false);
        return;
      }

      const propIds = props.map((p) => p.id);
      const { data } = await supabase
        .from("commissions")
        .select("*, clients(full_name), properties(property_name)")
        .in("property_id", propIds)
        .order("created_at", { ascending: false });

      const rows = (data || []).map((c: any) => ({
        id: c.id,
        commission_type: c.commission_type,
        amount: c.amount,
        status: c.status,
        created_at: c.created_at,
        client_name: c.clients?.full_name,
        property_name: c.properties?.property_name,
      }));
      setPayments(rows);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const totalPaid = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2.5">
                <Banknote className="h-5 w-5 text-success" />
              </div>
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
              <div className="rounded-lg bg-warning/10 p-2.5">
                <Banknote className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning">₦{totalPending.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No payment records yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="capitalize">{p.commission_type.replace("_", " ")}</TableCell>
                      <TableCell>{p.client_name || "—"}</TableCell>
                      <TableCell>{p.property_name || "—"}</TableCell>
                      <TableCell className="font-semibold">₦{p.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={p.status === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>
                          {p.status}
                        </Badge>
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
