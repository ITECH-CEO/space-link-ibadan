import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VerificationBadge } from "@/components/VerificationBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Eye, FileText, User, Phone, Shield, Pencil, Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export function ClientsTab() {
  const [clients, setClients] = useState<Tables<"clients">[]>([]);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editClient, setEditClient] = useState<Tables<"clients"> | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    setClients(data || []);
    
    // Fetch admin notes separately from secure table
    const { data: notesData } = await (supabase as any).from("client_admin_notes").select("client_id, notes");
    const notesMap: Record<string, string> = {};
    (notesData || []).forEach((n: any) => { if (n.notes) notesMap[n.client_id] = n.notes; });
    setAdminNotes(notesMap);
    
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const filtered = clients.filter(c => {
    const matchesSearch = !searchQuery ||
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone || "").includes(searchQuery) ||
      (c.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.faculty || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = async (id: string, status: "pending" | "approved" | "rejected") => {
    const { error } = await supabase.from("clients").update({ verification_status: status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Status updated"); fetchClients(); }
  };

  const openEdit = (c: Tables<"clients">) => {
    setEditClient(c);
    setEditForm({
      full_name: c.full_name,
      email: c.email || "",
      phone: c.phone || "",
      level: c.level || "",
      faculty: c.faculty || "",
      course: c.course || "",
      gender: c.gender || "",
      nin: c.nin || "",
      budget_min: c.budget_min || "",
      budget_max: c.budget_max || "",
      guarantor_name: c.guarantor_name || "",
      guarantor_phone: c.guarantor_phone || "",
      guarantor_relationship: c.guarantor_relationship || "",
      admin_notes: adminNotes[c.id] || "",
      verification_status: c.verification_status,
    });
    setEditDialogOpen(true);
  };

  const saveEdit = async () => {
    if (!editClient) return;
    setSaving(true);
    const { error } = await supabase
      .from("clients")
      .update({
        full_name: editForm.full_name,
        email: editForm.email || null,
        phone: editForm.phone || null,
        level: editForm.level || null,
        faculty: editForm.faculty || null,
        course: editForm.course || null,
        gender: editForm.gender || null,
        nin: editForm.nin || null,
        budget_min: editForm.budget_min ? Number(editForm.budget_min) : null,
        budget_max: editForm.budget_max ? Number(editForm.budget_max) : null,
        guarantor_name: editForm.guarantor_name || null,
        guarantor_phone: editForm.guarantor_phone || null,
        guarantor_relationship: editForm.guarantor_relationship || null,
        admin_notes: editForm.admin_notes || null,
        verification_status: editForm.verification_status,
      })
      .eq("id", editClient.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Client updated successfully");
      setEditDialogOpen(false);
      fetchClients();
    }
    setSaving(false);
  };

  const verificationChecks = (c: Tables<"clients">) => [
    { label: "Full Name", done: !!c.full_name, value: c.full_name },
    { label: "Phone", done: !!c.phone, value: c.phone },
    { label: "NIN", done: !!c.nin, value: c.nin },
    { label: "Government ID", done: !!c.government_id_url, value: c.government_id_url ? "Uploaded" : "Missing" },
    { label: "Proof of Admission", done: !!c.proof_of_admission_url, value: c.proof_of_admission_url ? "Uploaded" : "Missing" },
    { label: "Current Photo", done: !!c.current_photo_url, value: c.current_photo_url ? "Uploaded" : "Missing" },
    { label: "Guarantor Name", done: !!c.guarantor_name, value: c.guarantor_name },
    { label: "Guarantor Phone", done: !!c.guarantor_phone, value: c.guarantor_phone },
    { label: "Guarantor Relationship", done: !!c.guarantor_relationship, value: c.guarantor_relationship },
    { label: "Budget", done: !!(c.budget_min && c.budget_max), value: c.budget_min && c.budget_max ? `₦${Number(c.budget_min).toLocaleString()} – ₦${Number(c.budget_max).toLocaleString()}` : "Not set" },
  ];

  const completionPercent = (c: Tables<"clients">) => {
    const checks = verificationChecks(c);
    return Math.round((checks.filter((ch) => ch.done).length / checks.length) * 100);
  };

  return (
    <>
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="font-display">Client Registrations ({clients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, email, faculty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{searchQuery || statusFilter !== "all" ? "No clients match your filters." : "No clients registered yet."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div>
                          <span className="font-medium">{c.full_name}</span>
                          {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{c.phone || "—"}</TableCell>
                      <TableCell className="text-sm">{c.faculty || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full gradient-primary"
                              style={{ width: `${completionPercent(c)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{completionPercent(c)}%</span>
                        </div>
                      </TableCell>
                      <TableCell><VerificationBadge status={c.verification_status} /></TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="mr-1 h-4 w-4" /> View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" /> {c.full_name}
                                <VerificationBadge status={c.verification_status} />
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                              <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-primary" /> Verification Checklist
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {verificationChecks(c).map((ch) => (
                                    <div key={ch.label} className={`text-xs p-2 rounded border ${ch.done ? "border-success/20 bg-success/5" : "border-destructive/20 bg-destructive/5"}`}>
                                      <span className={ch.done ? "text-success" : "text-destructive"}>{ch.done ? "✓" : "✗"}</span>
                                      {" "}<span className="font-medium">{ch.label}:</span> {ch.value || "—"}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-primary" /> Documents
                                </h4>
                                <div className="grid grid-cols-3 gap-3">
                                  {c.government_id_url && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Government ID</p>
                                      <a href={c.government_id_url} target="_blank" rel="noopener noreferrer">
                                        <img src={c.government_id_url} alt="Gov ID" className="h-24 w-full rounded-lg object-cover border hover:opacity-80 transition" />
                                      </a>
                                    </div>
                                  )}
                                  {c.proof_of_admission_url && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Proof of Admission</p>
                                      <a href={c.proof_of_admission_url} target="_blank" rel="noopener noreferrer">
                                        <img src={c.proof_of_admission_url} alt="Admission" className="h-24 w-full rounded-lg object-cover border hover:opacity-80 transition" />
                                      </a>
                                    </div>
                                  )}
                                  {c.current_photo_url && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Current Photo</p>
                                      <a href={c.current_photo_url} target="_blank" rel="noopener noreferrer">
                                        <img src={c.current_photo_url} alt="Photo" className="h-24 w-full rounded-lg object-cover border hover:opacity-80 transition" />
                                      </a>
                                    </div>
                                  )}
                                  {!c.government_id_url && !c.proof_of_admission_url && !c.current_photo_url && (
                                    <p className="text-xs text-muted-foreground col-span-3">No documents uploaded yet.</p>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-primary" /> Guarantor Info
                                </h4>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                  <div><span className="text-muted-foreground">Name:</span> {c.guarantor_name || "—"}</div>
                                  <div><span className="text-muted-foreground">Phone:</span> {c.guarantor_phone || "—"}</div>
                                  <div><span className="text-muted-foreground">Relationship:</span> {c.guarantor_relationship || "—"}</div>
                                </div>
                              </div>

                              {c.preferences && c.preferences.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-sm mb-2">Preferences</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {c.preferences.map((p) => (
                                      <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Select onValueChange={(v) => updateStatus(c.id, v as any)} defaultValue={c.verification_status}>
                            <SelectTrigger className="w-[100px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approve</SelectItem>
                              <SelectItem value="rejected">Reject</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {filtered.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3">Showing {filtered.length} of {clients.length} clients</p>
          )}
        </CardContent>
      </Card>

      {/* Edit Client Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={editForm.full_name || ""} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={editForm.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={editForm.gender || ""} onValueChange={(v) => setEditForm({ ...editForm, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Level</Label>
                <Input value={editForm.level || ""} onChange={(e) => setEditForm({ ...editForm, level: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Faculty</Label>
                <Input value={editForm.faculty || ""} onChange={(e) => setEditForm({ ...editForm, faculty: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Course</Label>
                <Input value={editForm.course || ""} onChange={(e) => setEditForm({ ...editForm, course: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>NIN</Label>
                <Input value={editForm.nin || ""} onChange={(e) => setEditForm({ ...editForm, nin: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Budget Min (₦)</Label>
                <Input type="number" value={editForm.budget_min || ""} onChange={(e) => setEditForm({ ...editForm, budget_min: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Budget Max (₦)</Label>
                <Input type="number" value={editForm.budget_max || ""} onChange={(e) => setEditForm({ ...editForm, budget_max: e.target.value })} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Guarantor Name</Label>
                <Input value={editForm.guarantor_name || ""} onChange={(e) => setEditForm({ ...editForm, guarantor_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Guarantor Phone</Label>
                <Input value={editForm.guarantor_phone || ""} onChange={(e) => setEditForm({ ...editForm, guarantor_phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Guarantor Relationship</Label>
                <Input value={editForm.guarantor_relationship || ""} onChange={(e) => setEditForm({ ...editForm, guarantor_relationship: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Verification Status</Label>
              <Select value={editForm.verification_status} onValueChange={(v) => setEditForm({ ...editForm, verification_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Admin Notes (internal)</Label>
              <Textarea value={editForm.admin_notes || ""} onChange={(e) => setEditForm({ ...editForm, admin_notes: e.target.value })} placeholder="Internal notes..." />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveEdit} disabled={saving} className="gradient-primary text-primary-foreground">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
