import { useEffect, useState, useRef } from "react";
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
import { Plus, CheckCircle, XCircle, Pencil, Trash2, Search, Upload, X, Image, FileSpreadsheet, Download } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(p => p.id)));
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

  const [propertyAdminNotes, setPropertyAdminNotes] = useState<Record<string, string>>({});

  const fetchProperties = async () => {
    const { data } = await supabase.from("properties").select("*").order("created_at", { ascending: false });
    setProperties(data || []);
    
    // Fetch admin notes from secure table
    const { data: notesData } = await (supabase as any).from("property_admin_notes").select("property_id, notes");
    const notesMap: Record<string, string> = {};
    (notesData || []).forEach((n: any) => { if (n.notes) notesMap[n.property_id] = n.notes; });
    setPropertyAdminNotes(notesMap);
    
    setLoading(false);
  };

  useEffect(() => { fetchProperties(); }, []);

  const updateStatus = async (id: string, status: "pending" | "approved" | "rejected") => {
    const { error } = await supabase.from("properties").update({ verification_status: status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Status updated"); fetchProperties(); }
  };

  const filtered = properties.filter(p => {
    const matchesSearch = !searchQuery ||
      p.property_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.landlord_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      existingPhotos: p.photos || [],
    });
    setNewPhotos([]);
    setEditDialogOpen(true);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024);
    if (valid.length !== files.length) toast.error("Some files skipped (must be images under 5MB)");
    setNewPhotos(prev => [...prev, ...valid].slice(0, 10));
  };

  const removeExistingPhoto = (url: string) => {
    setEditForm((prev: any) => ({
      ...prev,
      existingPhotos: prev.existingPhotos.filter((p: string) => p !== url),
    }));
  };

  const saveEdit = async () => {
    if (!editProperty) return;
    setSaving(true);

    let uploadedUrls: string[] = [];
    if (newPhotos.length > 0) {
      setUploadingPhotos(true);
      for (const file of newPhotos) {
        const ext = file.name.split(".").pop();
        const path = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("property-media").upload(path, file);
        if (error) {
          toast.error(`Upload failed: ${file.name}`);
          continue;
        }
        const { data: urlData } = supabase.storage.from("property-media").getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }
      setUploadingPhotos(false);
    }

    const allPhotos = [...(editForm.existingPhotos || []), ...uploadedUrls];

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
        photos: allPhotos,
      })
      .eq("id", editProperty.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Property updated successfully");
      setEditDialogOpen(false);
      setEditProperty(null);
      setNewPhotos([]);
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

  const downloadCsvTemplate = () => {
    const headers = "property_name,address,location,property_type,landlord_name,landlord_phone,landlord_email,total_rooms,available_rooms,proximity_to_campus,facilities,special_notes";
    const example = '"Sunrise Hostel","12 Campus Rd","Akoka","hostel","John Doe","08012345678","john@email.com","20","5","500m","WiFi;Water;Security","Near campus gate"';
    const csv = headers + "\n" + example;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "properties_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvUploading(true);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        toast.error("CSV must have a header row and at least one data row");
        setCsvUploading(false);
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
      const requiredFields = ["property_name", "address", "landlord_name"];
      const missing = requiredFields.filter((f) => !headers.includes(f));
      if (missing.length > 0) {
        toast.error(`Missing required columns: ${missing.join(", ")}`);
        setCsvUploading(false);
        return;
      }

      // Parse CSV rows (handles quoted fields with commas)
      const parseRow = (line: string): string[] => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const rows = lines.slice(1).map((line) => {
        const values = parseRow(line);
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = values[i] || "";
        });
        return row;
      });

      const validTypes = ["single", "shared", "hostel"];
      const insertData = rows
        .filter((r) => r.property_name && r.address && r.landlord_name)
        .map((r) => ({
          property_name: r.property_name,
          address: r.address,
          location: r.location || null,
          property_type: (validTypes.includes(r.property_type) ? r.property_type : "single") as "single" | "shared" | "hostel",
          landlord_name: r.landlord_name,
          landlord_phone: r.landlord_phone || null,
          landlord_email: r.landlord_email || null,
          total_rooms: parseInt(r.total_rooms) || 0,
          available_rooms: parseInt(r.available_rooms) || 0,
          proximity_to_campus: r.proximity_to_campus || null,
          facilities: r.facilities ? r.facilities.split(";").map((f: string) => f.trim()) : [],
          special_notes: r.special_notes || null,
        }));

      if (insertData.length === 0) {
        toast.error("No valid rows found in CSV");
        setCsvUploading(false);
        return;
      }

      const { error } = await supabase.from("properties").insert(insertData);
      if (error) {
        toast.error(`Upload failed: ${error.message}`);
      } else {
        toast.success(`${insertData.length} properties imported successfully!`);
        fetchProperties();
      }
    } catch (err: any) {
      toast.error(`CSV parse error: ${err.message}`);
    }

    setCsvUploading(false);
    if (csvInputRef.current) csvInputRef.current.value = "";
  };

  return (
    <>
      <Card className="card-elevated">
        <CardHeader className="flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle className="font-display">Properties ({properties.length})</CardTitle>
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
            <Button size="sm" variant="outline" onClick={downloadCsvTemplate}>
              <Download className="mr-1 h-4 w-4" />Template
            </Button>
            <Button size="sm" variant="outline" onClick={() => csvInputRef.current?.click()} disabled={csvUploading}>
              <FileSpreadsheet className="mr-1 h-4 w-4" />{csvUploading ? "Importing..." : "CSV Import"}
            </Button>
            <input ref={csvInputRef} type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
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
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties, landlords, addresses..."
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
              <p className="text-muted-foreground">{searchQuery || statusFilter !== "all" ? "No properties match your filters." : "No properties listed yet."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selected.size === filtered.length && filtered.length > 0}
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
                  {filtered.map((p) => (
                    <TableRow key={p.id} data-state={selected.has(p.id) ? "selected" : undefined} className="hover:bg-muted/20">
                      <TableCell>
                        <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {p.photos && p.photos.length > 0 ? (
                            <img src={p.photos[0]} alt="" className="h-10 w-10 rounded-lg object-cover border" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                              <Image className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium">{p.property_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{p.landlord_name}</TableCell>
                      <TableCell className="capitalize text-sm">{p.property_type}</TableCell>
                      <TableCell className="text-sm">{p.available_rooms}/{p.total_rooms}</TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">{p.address}</TableCell>
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
          {filtered.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3">Showing {filtered.length} of {properties.length} properties</p>
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

            {/* Photo Management */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2"><Image className="h-4 w-4" /> Photos</Label>
              
              {/* Existing Photos */}
              {editForm.existingPhotos && editForm.existingPhotos.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {editForm.existingPhotos.map((url: string, i: number) => (
                    <div key={i} className="relative group">
                      <img src={url} alt={`Photo ${i + 1}`} className="h-20 w-full rounded-lg object-cover border" />
                      <button
                        type="button"
                        onClick={() => removeExistingPhoto(url)}
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload New */}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input p-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                <Upload className="h-4 w-4" />
                Add more photos
                <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />
              </label>
              {newPhotos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newPhotos.map((f, i) => (
                    <div key={i} className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">
                      <span className="truncate max-w-[80px]">{f.name}</span>
                      <button type="button" onClick={() => setNewPhotos(prev => prev.filter((_, j) => j !== i))}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
              <Button onClick={saveEdit} disabled={saving || uploadingPhotos} className="gradient-primary text-primary-foreground">
                {uploadingPhotos ? "Uploading photos..." : saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
