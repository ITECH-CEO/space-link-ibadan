import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Wrench, Search, Download, Plus, MessageSquare } from "lucide-react";

interface RequestRow {
  id: string;
  tenant_name: string;
  tenant_phone: string | null;
  description: string;
  priority: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  property_name: string;
  property_id: string;
}

export function ComplaintsTab() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [properties, setProperties] = useState<{ id: string; property_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [noteDialog, setNoteDialog] = useState<{ open: boolean; id: string; notes: string }>({ open: false, id: "", notes: "" });
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ property_id: "", tenant_name: "", tenant_phone: "", description: "", priority: "medium" });
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    const [{ data: props }, { data: reqs }] = await Promise.all([
      supabase.from("properties").select("id, property_name"),
      supabase.from("maintenance_requests").select("*").order("created_at", { ascending: false }),
    ]);
    setProperties(props || []);
    const propMap = new Map((props || []).map((p) => [p.id, p.property_name]));
    setRequests(
      (reqs || []).map((r: any) => ({ ...r, property_name: propMap.get(r.property_id) || "—" }))
    );
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("maintenance_requests").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const saveNotes = async () => {
    const { error } = await supabase.from("maintenance_requests").update({ notes: noteDialog.notes }).eq("id", noteDialog.id);
    if (error) return toast.error(error.message);
    toast.success("Notes saved");
    setRequests((prev) => prev.map((r) => (r.id === noteDialog.id ? { ...r, notes: noteDialog.notes } : r)));
    setNoteDialog({ open: false, id: "", notes: "" });
  };

  const handleCreate = async () => {
    if (!form.property_id || !form.tenant_name || !form.description) return toast.error("Fill required fields");
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
      toast.success("Complaint created");
      setCreateOpen(false);
      setForm({ property_id: "", tenant_name: "", tenant_phone: "", description: "", priority: "medium" });
      fetchAll();
    }
    setSaving(false);
  };

  const exportCSV = () => {
    const rows = filtered;
    if (!rows.length) return toast.error("No data to export");
    const header = "Date,Property,Tenant,Phone,Description,Priority,Status,Notes\n";
    const csv = header + rows.map((r) =>
      [new Date(r.created_at).toLocaleDateString(), `"${r.property_name}"`, `"${r.tenant_name}"`, r.tenant_phone || "", `"${r.description}"`, r.priority, r.status, `"${r.notes || ""}"`].join(",")
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "complaints.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = requests.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterPriority !== "all" && r.priority !== filterPriority) return false;
    if (search && !r.tenant_name.toLowerCase().includes(search.toLowerCase()) && !r.description.toLowerCase().includes(search.toLowerCase()) && !r.property_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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

  const counts = { open: requests.filter(r => r.status === "open").length, in_progress: requests.filter(r => r.status === "in_progress").length, resolved: requests.filter(r => r.status === "resolved").length };

  if (loading) return <p className="text-muted-foreground p-4">Loading complaints...</p>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Open</p><p className="text-2xl font-bold text-warning">{counts.open}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">In Progress</p><p className="text-2xl font-bold text-primary">{counts.in_progress}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Resolved</p><p className="text-2xl font-bold text-success">{counts.resolved}</p></CardContent></Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tenant, property, issue..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={exportCSV}><Download className="mr-1 h-4 w-4" />Export</Button>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground"><Plus className="mr-1 h-4 w-4" />New Complaint</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Complaint</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Property *</Label>
                <Select value={form.property_id} onValueChange={(v) => setForm({ ...form, property_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                  <SelectContent>{properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Tenant Name *</Label><Input value={form.tenant_name} onChange={(e) => setForm({ ...form, tenant_name: e.target.value })} maxLength={100} /></div>
                <div className="space-y-2"><Label>Tenant Phone</Label><Input value={form.tenant_phone} onChange={(e) => setForm({ ...form, tenant_phone: e.target.value })} maxLength={20} /></div>
              </div>
              <div className="space-y-2"><Label>Description *</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} /></div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full gradient-primary text-primary-foreground">{saving ? "Saving..." : "Submit"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notes Dialog */}
      <Dialog open={noteDialog.open} onOpenChange={(o) => !o && setNoteDialog({ open: false, id: "", notes: "" })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Admin Notes</DialogTitle></DialogHeader>
          <Textarea value={noteDialog.notes} onChange={(e) => setNoteDialog({ ...noteDialog, notes: e.target.value })} maxLength={500} rows={4} />
          <Button onClick={saveNotes} className="w-full">Save Notes</Button>
        </DialogContent>
      </Dialog>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Wrench className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" /><p className="text-muted-foreground">No complaints found.</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead><TableHead>Property</TableHead><TableHead>Tenant</TableHead>
                    <TableHead>Issue</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead><TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{r.property_name}</TableCell>
                      <TableCell>
                        <div>{r.tenant_name}</div>
                        {r.tenant_phone && <div className="text-xs text-muted-foreground">{r.tenant_phone}</div>}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{r.description}</TableCell>
                      <TableCell><Badge variant="outline" className={priorityColors[r.priority] || ""}>{r.priority}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={statusColors[r.status] || ""}>{r.status.replace("_", " ")}</Badge></TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => setNoteDialog({ open: true, id: r.id, notes: r.notes || "" })}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
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
