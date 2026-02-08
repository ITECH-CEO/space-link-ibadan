import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface CommissionRow {
  id: string;
  commission_type: string;
  amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  client_name?: string;
  property_name?: string;
}

export function CommissionsTab() {
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase
      .from("commissions")
      .select("*, clients(full_name), properties(property_name)")
      .order("created_at", { ascending: false });

    const rows = (data || []).map((c: any) => ({
      id: c.id,
      commission_type: c.commission_type,
      amount: c.amount,
      status: c.status,
      notes: c.notes,
      created_at: c.created_at,
      client_name: c.clients?.full_name,
      property_name: c.properties?.property_name,
    }));
    setCommissions(rows);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("commissions").update({ status: status as any }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); fetch(); }
  };

  const totalRevenue = commissions.filter((c) => c.status === "paid").reduce((sum, c) => sum + c.amount, 0);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Commission Tracker</CardTitle>
        <div className="rounded-lg bg-success/10 px-4 py-2 text-success font-semibold">
          Total Paid: ₦{totalRevenue.toLocaleString()}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : commissions.length === 0 ? (
          <p className="text-muted-foreground">No commissions tracked yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Amount (₦)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="capitalize">{c.commission_type.replace("_", " ")}</TableCell>
                    <TableCell>{c.client_name || "—"}</TableCell>
                    <TableCell>{c.property_name || "—"}</TableCell>
                    <TableCell className="font-semibold">₦{c.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={c.status === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select onValueChange={(v) => updateStatus(c.id, v)} defaultValue={c.status}>
                        <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
