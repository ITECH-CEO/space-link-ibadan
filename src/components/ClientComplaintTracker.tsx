import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Clock, CheckCircle, AlertTriangle } from "lucide-react";

interface ComplaintRecord {
  id: string;
  description: string;
  priority: string;
  status: string;
  notes: string | null;
  created_at: string;
  property_name: string;
}

export function ClientComplaintTracker() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchComplaints = async () => {
      const { data: client } = await supabase
        .from("clients")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!client) { setLoading(false); return; }

      const { data } = await supabase
        .from("maintenance_requests")
        .select("id, description, priority, status, notes, created_at, properties(property_name)")
        .ilike("tenant_name", client.full_name)
        .order("created_at", { ascending: false });

      setComplaints((data || []).map((r: any) => ({
        id: r.id,
        description: r.description,
        priority: r.priority,
        status: r.status,
        notes: r.notes,
        created_at: r.created_at,
        property_name: r.properties?.property_name || "—",
      })));
      setLoading(false);
    };
    fetchComplaints();
  }, [user]);

  if (loading) return null;
  if (complaints.length === 0) return null;

  const statusIcon = (s: string) => {
    switch (s) {
      case "resolved": case "closed": return <CheckCircle className="h-4 w-4 text-success" />;
      case "in_progress": return <Clock className="h-4 w-4 text-primary" />;
      default: return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
  };

  const statusBadgeClass = (s: string) => {
    switch (s) {
      case "resolved": case "closed": return "bg-success/10 text-success";
      case "in_progress": return "bg-primary/10 text-primary";
      default: return "bg-warning/10 text-warning";
    }
  };

  const priorityClass = (p: string) => {
    switch (p) {
      case "urgent": return "bg-destructive/10 text-destructive";
      case "high": return "bg-warning/10 text-warning";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-semibold flex items-center gap-2">
        <Wrench className="h-5 w-5 text-primary" /> My Complaints
      </h3>

      <div className="space-y-3">
        {complaints.map(c => (
          <Card key={c.id} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  {statusIcon(c.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{c.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{c.property_name} · {new Date(c.created_at).toLocaleDateString()}</p>
                    {c.notes && (
                      <p className="text-xs text-muted-foreground mt-1.5 bg-muted/50 rounded p-2">
                        <span className="font-medium">Admin note:</span> {c.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge variant="outline" className={statusBadgeClass(c.status)}>{c.status.replace("_", " ")}</Badge>
                  <Badge variant="outline" className={priorityClass(c.priority)}>{c.priority}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
