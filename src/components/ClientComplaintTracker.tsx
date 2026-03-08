import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Clock, CheckCircle, AlertTriangle, MessageSquareWarning } from "lucide-react";

interface MaintenanceRecord {
  id: string;
  description: string;
  priority: string;
  status: string;
  notes: string | null;
  created_at: string;
  property_name: string;
  room_type_name: string | null;
}

interface PlatformRecord {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export function ClientComplaintTracker() {
  const { user } = useAuth();
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [platform, setPlatform] = useState<PlatformRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: client } = await supabase
        .from("clients")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      // Fetch maintenance complaints
      if (client) {
        const { data } = await (supabase as any)
          .from("maintenance_requests")
          .select("id, description, priority, status, notes, created_at, properties(property_name), room_types(name)")
          .ilike("tenant_name", client.full_name)
          .order("created_at", { ascending: false });

        setMaintenance((data || []).map((r: any) => ({
          id: r.id,
          description: r.description,
          priority: r.priority,
          status: r.status,
          notes: r.notes,
          created_at: r.created_at,
          property_name: r.properties?.property_name || "—",
          room_type_name: r.room_types?.name || null,
        })));
      }

      // Fetch platform complaints
      const { data: platData } = await (supabase as any)
        .from("platform_complaints")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setPlatform(platData || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return null;
  if (maintenance.length === 0 && platform.length === 0) return null;

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

  const renderMaintenance = () => maintenance.map(c => (
    <Card key={c.id} className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            {statusIcon(c.status)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-2">{c.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {c.property_name}{c.room_type_name ? ` — ${c.room_type_name}` : ""} · {new Date(c.created_at).toLocaleDateString()}
              </p>
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
  ));

  const renderPlatform = () => platform.map(c => (
    <Card key={c.id} className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            {statusIcon(c.status)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{c.subject}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <Badge variant="secondary" className="text-[10px] mr-1">{c.category}</Badge>
                {new Date(c.created_at).toLocaleDateString()}
              </p>
              {c.admin_notes && (
                <p className="text-xs text-muted-foreground mt-1.5 bg-muted/50 rounded p-2">
                  <span className="font-medium">Admin note:</span> {c.admin_notes}
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
  ));

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-semibold flex items-center gap-2">
        <Wrench className="h-5 w-5 text-primary" /> My Complaints
      </h3>

      {maintenance.length > 0 && platform.length > 0 ? (
        <Tabs defaultValue="maintenance">
          <TabsList>
            <TabsTrigger value="maintenance"><Wrench className="mr-1.5 h-3.5 w-3.5" />Maintenance ({maintenance.length})</TabsTrigger>
            <TabsTrigger value="platform"><MessageSquareWarning className="mr-1.5 h-3.5 w-3.5" />Platform ({platform.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="maintenance"><div className="space-y-3">{renderMaintenance()}</div></TabsContent>
          <TabsContent value="platform"><div className="space-y-3">{renderPlatform()}</div></TabsContent>
        </Tabs>
      ) : maintenance.length > 0 ? (
        <div className="space-y-3">{renderMaintenance()}</div>
      ) : (
        <div className="space-y-3">{renderPlatform()}</div>
      )}
    </div>
  );
}
