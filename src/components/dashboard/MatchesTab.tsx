import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";

interface MatchRow {
  id: string;
  status: string;
  compatibility_score: number | null;
  created_at: string;
  client_name?: string;
  client_phone?: string;
  property_name?: string;
}

export function MatchesTab() {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    const { data } = await supabase
      .from("matches")
      .select("id, status, compatibility_score, created_at, clients(full_name, phone), properties(property_name)")
      .order("created_at", { ascending: false });

    const rows = (data || []).map((m: any) => ({
      id: m.id,
      status: m.status,
      compatibility_score: m.compatibility_score,
      created_at: m.created_at,
      client_name: m.clients?.full_name,
      client_phone: m.clients?.phone,
      property_name: m.properties?.property_name,
    }));
    setMatches(rows);
    setLoading(false);
  };

  useEffect(() => { fetchMatches(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("matches").update({ status: status as any }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Match updated"); fetchMatches(); }
  };

  const sendWhatsApp = (phone: string | undefined, propertyName: string | undefined) => {
    if (!phone) { toast.error("No phone number available"); return; }
    const cleanPhone = phone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Hello! You've been matched to "${propertyName || 'a property'}" on SpaceLink. Contact us to schedule an inspection! 🏠`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
  };

  const statusColors: Record<string, string> = {
    pending: "bg-warning/10 text-warning",
    accepted: "bg-success/10 text-success",
    rejected: "bg-destructive/10 text-destructive",
  };

  return (
    <Card>
      <CardHeader><CardTitle>Matches</CardTitle></CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : matches.length === 0 ? (
          <p className="text-muted-foreground">No matches yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.client_name || "—"}</TableCell>
                    <TableCell>{m.property_name || "—"}</TableCell>
                    <TableCell>{m.compatibility_score ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[m.status] || ""}>
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Select onValueChange={(v) => updateStatus(m.id, v)} defaultValue={m.status}>
                        <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="accepted">Accept</SelectItem>
                          <SelectItem value="rejected">Reject</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => sendWhatsApp(m.client_phone, m.property_name)}
                        title="Send WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
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
