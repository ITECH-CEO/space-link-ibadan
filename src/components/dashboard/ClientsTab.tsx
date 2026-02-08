import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VerificationBadge } from "@/components/VerificationBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export function ClientsTab() {
  const [clients, setClients] = useState<Tables<"clients">[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    setClients(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const updateStatus = async (id: string, status: "pending" | "approved" | "rejected") => {
    const { error } = await supabase.from("clients").update({ verification_status: status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Status updated"); fetchClients(); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Registrations</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : clients.length === 0 ? (
          <p className="text-muted-foreground">No clients registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>NIN</TableHead>
                  <TableHead>Budget (₦)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.full_name}</TableCell>
                    <TableCell>{c.phone || "—"}</TableCell>
                    <TableCell>{c.nin || "—"}</TableCell>
                    <TableCell>
                      {c.budget_min && c.budget_max
                        ? `₦${Number(c.budget_min).toLocaleString()} – ₦${Number(c.budget_max).toLocaleString()}`
                        : "—"}
                    </TableCell>
                    <TableCell><VerificationBadge status={c.verification_status} /></TableCell>
                    <TableCell>
                      <Select onValueChange={(v) => updateStatus(c.id, v as any)} defaultValue={c.verification_status}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approve</SelectItem>
                          <SelectItem value="rejected">Reject</SelectItem>
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
