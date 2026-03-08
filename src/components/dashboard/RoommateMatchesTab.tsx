import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Sparkles, Loader2, MessageCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RoommateMatch {
  id: string;
  status: string;
  compatibility_score: number | null;
  ai_reasoning: string | null;
  created_at: string;
  client_a_name?: string;
  client_b_name?: string;
  client_a_phone?: string;
  client_b_phone?: string;
  property_name?: string;
}

export function RoommateMatchesTab() {
  const [matches, setMatches] = useState<RoommateMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchMatches = async () => {
    // roommate_matches isn't in generated types, use .from() with any
    const { data } = await (supabase as any)
      .from("roommate_matches")
      .select("id, status, compatibility_score, ai_reasoning, created_at, property_id, client_a_id, client_b_id, properties(property_name)")
      .order("compatibility_score", { ascending: false });

    if (!data) { setLoading(false); return; }

    // Fetch client names
    const clientIds = new Set<string>();
    for (const m of data) {
      clientIds.add(m.client_a_id);
      clientIds.add(m.client_b_id);
    }
    const { data: clients } = await supabase
      .from("clients")
      .select("id, full_name, phone")
      .in("id", [...clientIds]);

    const clientMap = new Map((clients || []).map(c => [c.id, c]));

    const rows = data.map((m: any) => ({
      id: m.id,
      status: m.status,
      compatibility_score: m.compatibility_score,
      ai_reasoning: m.ai_reasoning,
      created_at: m.created_at,
      client_a_name: clientMap.get(m.client_a_id)?.full_name || "—",
      client_b_name: clientMap.get(m.client_b_id)?.full_name || "—",
      client_a_phone: clientMap.get(m.client_a_id)?.phone,
      client_b_phone: clientMap.get(m.client_b_id)?.phone,
      property_name: m.properties?.property_name,
    }));
    setMatches(rows);
    setLoading(false);
  };

  useEffect(() => { fetchMatches(); }, []);

  const runRoommateMatch = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Not authenticated"); return; }

      const res = await supabase.functions.invoke("roommate-match", { body: {} });
      if (res.error) {
        toast.error(res.error.message || "Matching failed");
      } else {
        toast.success(res.data.message || "Done!");
        fetchMatches();
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setGenerating(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any).from("roommate_matches").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); fetchMatches(); }
  };

  const sendWhatsApp = (phone: string | undefined, partnerName: string | undefined) => {
    if (!phone) { toast.error("No phone number"); return; }
    const clean = phone.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Hello! You've been matched with a potential roommate "${partnerName || 'someone'}" on MyCrib.ng. Contact us for more details! 🏠👫`
    );
    window.open(`https://wa.me/${clean}?text=${msg}`, "_blank");
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
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" /> Roommate Matches
        </CardTitle>
        <Button onClick={runRoommateMatch} disabled={generating} className="gradient-primary text-primary-foreground" size="sm">
          {generating ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" />Auto-Match Roommates</>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : matches.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground mb-2">No roommate matches yet.</p>
            <p className="text-sm text-muted-foreground">Click "Auto-Match Roommates" to find compatible pairs using AI.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client A</TableHead>
                  <TableHead>Client B</TableHead>
                  <TableHead>Shared Property</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>AI Insight</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.client_a_name}</TableCell>
                    <TableCell className="font-medium">{m.client_b_name}</TableCell>
                    <TableCell>{m.property_name || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>
                      <span className={scoreColor(m.compatibility_score)}>
                        {m.compatibility_score ?? "—"}%
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs text-muted-foreground truncate cursor-help">
                            {m.ai_reasoning || "—"}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">{m.ai_reasoning}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[m.status] || ""}>{m.status}</Badge>
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
                      <Button variant="outline" size="icon" onClick={() => sendWhatsApp(m.client_a_phone, m.client_b_name)} title="WhatsApp Client A">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => sendWhatsApp(m.client_b_phone, m.client_a_name)} title="WhatsApp Client B">
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
