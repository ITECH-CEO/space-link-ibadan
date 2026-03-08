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
import { PropertyForm } from "@/components/forms/PropertyForm";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, CheckCircle, XCircle, Pencil, Eye, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export function PropertiesTab() {
  const [properties, setProperties] = useState<Tables<"properties">[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editProperty, setEditProperty] = useState<Tables<"properties"> | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === properties.length) setSelected(new Set());
    else setSelected(new Set(properties.map(p => p.id)));
  };

  const bulkUpdateStatus = async (status: "approved" | "rejected") => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const { error } = await supabase
      .from("properties")
      .update({ verification_status: status })
      .in("id", ids);
    if (error) toast.error(error.message);
    else {
      toast.success(`${ids.length} properties ${status}`);
      setSelected(new Set());
      fetchProperties();
    }
  };

  const fetchProperties = async () => {
    const { data } = await supabase.from("properties").select("*").order("created_at", { ascending: false });
    setProperties(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProperties(); }, []);

  const updateStatus = async (id: string, status: "pending" | "approved" | "rejected") => {
    const { error } = await supabase.from("properties").update({ verification_status: status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Status updated"); fetchProperties(); }
  };

  const openEdit = (p: Tables<"properties">) => {
    setEditProperty(p);
    setEditForm({
      property_name: p.property_name,
      address: p.address,
      location: p.location || "",
      property_type: p.property_type,
      landlord_name: p.landlord_name,
      landlord_phone: p.landlord_phone || "",
      landlord_email: p.landlord_email || "",
      total_rooms: p.total_rooms ?? 0,
      available_rooms: p.available_rooms ?? 0,
      proximity_to_campus: p.proximity_to_campus || "",
      special_notes: p.special_notes || "",
      admin_notes: p.admin_notes || "",
      verification_status: p.verification_status,
    });
    setEditDialogOpen(true);
  };

  const saveEdit = async () => {
    if (!editProperty) return;
    setSaving(true);
    const { error } = await supabase
      .from("properties")
      .update({
        property_name: editForm.property_name,
        address: editForm.address,
        location: editForm.location || null,
        property_type: editForm.property_type,
        landlord_name: editForm.landlord_name,
        landlord_phone: editForm.landlord_phone || null,
        landlord_email: editForm.landlord_email || null,
        total_rooms: Number(editForm.total_rooms),
        available_rooms: Number(editForm.available_rooms),
        proximity_to_campus: editForm.proximity_to_campus || null,
        special_notes: editForm.special_notes || null,
        admin_notes: editForm.admin_notes || null,
        verification_status: editForm.verification_status,
      })
      .eq("id", editProperty.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Property updated successfully");
      setEditDialogOpen(false);
      setEditProperty(null);
      fetchProperties();
    }
    setSaving(false);
  };

  const deleteProperty = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property? This cannot be undone.")) return;
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Property deleted"); fetchProperties(); }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle>Properties</CardTitle>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <>
                <Button size="sm" variant="outline" className="text-success border-success/30" onClick={() => bulkUpdateStatus("approved")}>
                  <CheckCircle className="mr-1 h-4 w-4" />Approve ({selected.size})
                </Button>
                <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => bulkUpdateStatus("rejected")}>
                  <XCircle className="mr-1 h-4 w-4" />Reject ({selected.size})
                </Button>
              </>
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary text-primary-foreground">
                  <Plus className="mr-2 h-4 w-4" />Add Property
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader><DialogTitle>Add New Property</DialogTitle></DialogHeader>
                <PropertyForm onSuccess={() => { setDialogOpen(false); fetchProperties(); }} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : properties.length === 0 ? (
            <p className="text-muted-foreground">No properties listed yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selected.size === properties.length && properties.length > 0}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Landlord</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Rooms</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((p) => (
                    <TableRow key={p.id} data-state={selected.has(p.id) ? "selected" : undefined}>
                      <TableCell>
                        <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                      </TableCell>
                      <TableCell className="font-medium">{p.property_name}</TableCell>
                      <TableCell>{p.landlord_name}</TableCell>
                      <TableCell className="capitalize">{p.property_type}</TableCell>
                      <TableCell>{p.available_rooms}/{p.total_rooms}</TableCell>
                      <TableCell>{p.address}</TableCell>
                      <TableCell><VerificationBadge status={p.verification_status} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteProperty(p.id)} title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Select onValueChange={(v) => updateStatus(p.id, v as any)} defaultValue={p.verification_status}>
                            <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue /></SelectTrigger>
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
        </CardContent>
      </Card>

      {/* Edit Property Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Property Name</Label>
                <Input value={editForm.property_name || ""} onChange={(e) => setEditForm({ ...editForm, property_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Property Type</Label>
                <Select value={editForm.property_type} onValueChange={(v) => setEditForm({ ...editForm, property_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="shared">Shared</SelectItem>
                    <SelectItem value="hostel">Hostel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Address</Label>
                <Input value={editForm.address || ""} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={editForm.location || ""} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Proximity to Campus</Label>
                <Input value={editForm.proximity_to_campus || ""} onChange={(e) => setEditForm({ ...editForm, proximity_to_campus: e.target.value })} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Landlord Name</Label>
                <Input value={editForm.landlord_name || ""} onChange={(e) => setEditForm({ ...editForm, landlord_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Landlord Phone</Label>
                <Input value={editForm.landlord_phone || ""} onChange={(e) => setEditForm({ ...editForm, landlord_phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Landlord Email</Label>
                <Input value={editForm.landlord_email || ""} onChange={(e) => setEditForm({ ...editForm, landlord_email: e.target.value })} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Total Rooms</Label>
                <Input type="number" value={editForm.total_rooms || 0} onChange={(e) => setEditForm({ ...editForm, total_rooms: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Available Rooms</Label>
                <Input type="number" value={editForm.available_rooms || 0} onChange={(e) => setEditForm({ ...editForm, available_rooms: e.target.value })} />
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
              <Label>Special Notes</Label>
              <Textarea value={editForm.special_notes || ""} onChange={(e) => setEditForm({ ...editForm, special_notes: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Admin Notes (internal)</Label>
              <Textarea value={editForm.admin_notes || ""} onChange={(e) => setEditForm({ ...editForm, admin_notes: e.target.value })} placeholder="Internal notes visible only to admins..." />
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
