import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MessageSquareWarning, Search, Download, MessageSquare } from "lucide-react";

interface PlatformRow {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  admin_notes: string | null;
  created_at: string;
}

export function PlatformComplaintsTab() {
  const [rows, setRows] = useState<PlatformRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [noteDialog, setNoteDialog] = useState<{ open: boolean; id: string; notes: string }>({ open: false, id: "", notes: "" });

  const fetchAll = async () => {
    const { data } = await (supabase as any)
      .from("platform_complaints")
      .select("*")
      .order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any).from("platform_complaints").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const saveNotes = async () => {
    const { error } = await (supabase as any).from("platform_complaints").update({ admin_notes: noteDialog.notes }).eq("id", noteDialog.id);
    if (error) return toast.error(error.message);
    toast.success("Notes saved");
    setRows(prev => prev.map(r => r.id === noteDialog.id ? { ...r, admin_notes: noteDialog.notes } : r));
    setNoteDialog({ open: false, id: "", notes: "" });
  };

  const exportCSV = () => {
    if (!filtered.length) return toast.error("No data to export");
    const header = "Date,Client,Email,Phone,Category,Subject,Description,Priority,Status,Admin Notes\n";
    const csv = header + filtered.map(r =>
      [new Date(r.created_at).toLocaleDateString(), `"${r.client_name}"`, r.client_email || "", r.client_phone || "",
       r.category, `"${r.subject}"`, `"${r.description}"`, r.priority, r.status, `"${r.admin_notes || ""}"`].join(",")
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "platform-complaints.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = rows.filter(r => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterCategory !== "all" && r.category !== filterCategory) return false;
    if (search && !r.client_name.toLowerCase().includes(search.toLowerCase()) &&
        !r.subject.toLowerCase().includes(search.toLowerCase()) &&
        !r.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const priorityColors: Record<string, string> = {
    low: "bg-muted text-muted-foreground", medium: "bg-warning/10 text-warning",
    high: "bg-destructive/10 text-destructive", urgent: "bg-destructive text-destructive-foreground",
  };
  const statusColors: Record<string, string> = {
    open: "bg-warning/10 text-warning", in_progress: "bg-primary/10 text-primary",
    resolved: "bg-success/10 text-success", closed: "bg-muted text-muted-foreground",
  };
  const categoryColors: Record<string, string> = {
    general: "bg-muted text-muted-foreground", service: "bg-warning/10 text-warning",
    billing: "bg-primary/10 text-primary", matching: "bg-accent/10 text-accent-foreground",
    account: "bg-destructive/10 text-destructive", suggestion: "bg-success/10 text-success",
  };

  const counts = {
    open: rows.filter(r => r.status === "open").length,
    in_progress: rows.filter(r => r.status === "in_progress").length,
    resolved: rows.filter(r => r.status === "resolved").length,
  };

  if (loading) return <p className="text-muted-foreground p-4">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Open</p><p className="text-2xl font-bold text-warning">{counts.open}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">In Progress</p><p className="text-2xl font-bold text-primary">{counts.in_progress}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Resolved</p><p className="text-2xl font-bold text-success">{counts.resolved}</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search client, subject..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="service">Service</SelectItem>
            <SelectItem value="billing">Billing</SelectItem>
            <SelectItem value="matching">Matching</SelectItem>
            <SelectItem value="account">Account</SelectItem>
            <SelectItem value="suggestion">Suggestion</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={exportCSV}><Download className="mr-1 h-4 w-4" />Export</Button>
      </div>

      <Dialog open={noteDialog.open} onOpenChange={o => !o && setNoteDialog({ open: false, id: "", notes: "" })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Admin Notes</DialogTitle></DialogHeader>
          <Textarea value={noteDialog.notes} onChange={e => setNoteDialog({ ...noteDialog, notes: e.target.value })} maxLength={500} rows={4} />
          <Button onClick={saveNotes} className="w-full">Save Notes</Button>
        </DialogContent>
      </Dialog>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><MessageSquareWarning className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" /><p className="text-muted-foreground">No platform complaints found.</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead><TableHead>Client</TableHead><TableHead>Category</TableHead>
                    <TableHead>Subject</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead><TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="font-medium">{r.client_name}</div>
                        {r.client_email && <div className="text-xs text-muted-foreground">{r.client_email}</div>}
                      </TableCell>
                      <TableCell><Badge variant="outline" className={categoryColors[r.category] || ""}>{r.category}</Badge></TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="font-medium text-sm truncate">{r.subject}</div>
                        <div className="text-xs text-muted-foreground truncate">{r.description}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className={priorityColors[r.priority] || ""}>{r.priority}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={statusColors[r.status] || ""}>{r.status.replace("_", " ")}</Badge></TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => setNoteDialog({ open: true, id: r.id, notes: r.admin_notes || "" })}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Select onValueChange={v => updateStatus(r.id, v)} defaultValue={r.status}>
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
