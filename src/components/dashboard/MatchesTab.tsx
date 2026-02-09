import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MessageCircle, Sparkles, Loader2 } from "lucide-react";

interface MatchRow {
  id: string;
  status: string;
  compatibility_score: number | null;
  created_at: string;
  client_name?: string;
  client_phone?: string;
  property_name?: string;
  room_type_name?: string;
}

export function MatchesTab() {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchMatches = async () => {
    const { data } = await supabase
      .from("matches")
      .select("id, status, compatibility_score, created_at, clients(full_name, phone), properties(property_name), room_types(name)")
      .order("compatibility_score", { ascending: false });

    const rows = (data || []).map((m: any) => ({
      id: m.id,
      status: m.status,
      compatibility_score: m.compatibility_score,
      created_at: m.created_at,
      client_name: m.clients?.full_name,
      client_phone: m.clients?.phone,
      property_name: m.properties?.property_name,
      room_type_name: m.room_types?.name,
    }));
    setMatches(rows);
    setLoading(false);
  };

  useEffect(() => { fetchMatches(); }, []);

  const runSmartMatch = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Not authenticated"); return; }

      const res = await supabase.functions.invoke("smart-match", {
        body: {},
      });

      if (res.error) {
        toast.error(res.error.message || "Matching failed");
      } else {
        toast.success(res.data.message || "Matching complete!");
        fetchMatches();
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setGenerating(false);
    }
  };

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

  const scoreColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 70) return "text-success font-bold";
    if (score >= 50) return "text-warning font-semibold";
    return "text-muted-foreground";
  };

  const statusColors: Record<string, string> = {
    pending: "bg-warning/10 text-warning border-warning/20",
    accepted: "bg-success/10 text-success border-success/20",
    rejected: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Matches</CardTitle>
        <Button
          onClick={runSmartMatch}
          disabled={generating}
          className="gradient-primary text-primary-foreground"
          size="sm"
        >
          {generating ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" />Auto-Match</>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : matches.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground mb-2">No matches yet.</p>
            <p className="text-sm text-muted-foreground">Click "Auto-Match" to generate matches based on budget, preferences, and compatibility.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Room Type</TableHead>
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
                    <TableCell>{m.room_type_name || "—"}</TableCell>
                    <TableCell>
                      <span className={scoreColor(m.compatibility_score)}>
                        {m.compatibility_score ?? "—"}%
                      </span>
                    </TableCell>
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
                        title="Send WhatsApp notification"
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
