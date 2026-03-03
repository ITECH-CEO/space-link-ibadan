import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Wrench } from "lucide-react";

interface MaintenanceRow {
  id: string;
  tenant_name: string;
  tenant_phone: string | null;
  description: string;
  priority: string;
  status: string;
  notes: string | null;
  created_at: string;
  property_name?: string;
}

export function LandlordMaintenanceTab() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRow[]>([]);
  const [properties, setProperties] = useState<{ id: string; property_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    property_id: "",
    tenant_name: "",
    tenant_phone: "",
    description: "",
    priority: "medium",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: props } = await supabase
        .from("properties")
        .select("id, property_name")
        .eq("owner_user_id", user.id);

      setProperties(props || []);

      if (!props || props.length === 0) {
        setLoading(false);
        return;
      }

      const propIds = props.map((p) => p.id);
      const { data } = await supabase
        .from("maintenance_requests")
        .select("*")
        .in("property_id", propIds)
        .order("created_at", { ascending: false });

      const propMap = new Map(props.map((p) => [p.id, p.property_name]));
      const rows = (data || []).map((r: any) => ({
        ...r,
        property_name: propMap.get(r.property_id) || "—",
      }));
      setRequests(rows);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSubmit = async () => {
    if (!form.property_id || !form.tenant_name || !form.description) {
      toast.error("Fill in required fields");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("maintenance_requests").insert({
      property_id: form.property_id,
      tenant_name: form.tenant_name,
      tenant_phone: form.tenant_phone || null,
      description: form.description,
      priority: form.priority,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Request created!");
      setDialogOpen(false);
      setForm({ property_id: "", tenant_name: "", tenant_phone: "", description: "", priority: "medium" });
      // Refresh
      const propIds = properties.map((p) => p.id);
      const { data } = await supabase
        .from("maintenance_requests")
        .select("*")
        .in("property_id", propIds)
        .order("created_at", { ascending: false });
      const propMap = new Map(properties.map((p) => [p.id, p.property_name]));
      setRequests((data || []).map((r: any) => ({ ...r, property_name: propMap.get(r.property_id) || "—" })));
    }
    setSaving(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("maintenance_requests").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Updated");
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    }
  };

  const priorityColors: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-warning/10 text-warning",
    high: "bg-destructive/10 text-destructive",
    urgent: "bg-destructive text-destructive-foreground",
  };

  const statusColors: Record<string, string> = {
    open: "bg-warning/10 text-warning",
    in_progress: "bg-primary/10 text-primary",
    resolved: "bg-success/10 text-success",
    closed: "bg-muted text-muted-foreground",
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Maintenance Requests</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground">
              <Plus className="mr-1 h-4 w-4" />New Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Maintenance Request</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Property *</Label>
                <Select value={form.property_id} onValueChange={(v) => setForm({ ...form, property_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tenant Name *</Label>
                  <Input value={form.tenant_name} onChange={(e) => setForm({ ...form, tenant_name: e.target.value })} maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label>Tenant Phone</Label>
                  <Input value={form.tenant_phone} onChange={(e) => setForm({ ...form, tenant_phone: e.target.value })} maxLength={20} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} disabled={saving} className="w-full gradient-primary text-primary-foreground">
                {saving ? "Saving..." : "Submit Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wrench className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No maintenance requests yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{r.property_name}</TableCell>
                      <TableCell>{r.tenant_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{r.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={priorityColors[r.priority] || ""}>{r.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[r.status] || ""}>{r.status.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select onValueChange={(v) => updateStatus(r.id, v)} defaultValue={r.status}>
                          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
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
