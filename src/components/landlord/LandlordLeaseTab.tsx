import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus, Eye, Printer, X, CheckCircle, Share2, Copy } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface LeaseAgreement {
  id: string;
  property_id: string;
  room_type_id: string | null;
  tenant_name: string;
  tenant_email: string | null;
  tenant_phone: string | null;
  start_date: string;
  end_date: string;
  rent_amount: number;
  payment_frequency: string;
  security_deposit: number;
  custom_terms: string[];
  additional_notes: string | null;
  status: string;
  acknowledged_at: string | null;
  access_token: string | null;
  created_at: string;
}

interface Property {
  id: string;
  property_name: string;
  address: string;
  landlord_name: string;
}

interface RoomType {
  id: string;
  name: string;
  price: number;
  property_id: string;
}

const DEFAULT_TERMS = [
  "Tenant shall pay rent on or before the due date each period.",
  "Tenant shall maintain the property in good condition.",
  "No structural modifications without landlord's written consent.",
  "Tenant shall not sublet without written permission.",
  "Landlord shall provide 30 days notice before any rent increase.",
  "Either party may terminate with 30 days written notice.",
  "Tenant is responsible for utility bills unless otherwise stated.",
];

export function LandlordLeaseTab() {
  const { user } = useAuth();
  const [leases, setLeases] = useState<LeaseAgreement[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [previewLease, setPreviewLease] = useState<LeaseAgreement | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    property_id: "",
    room_type_id: "",
    tenant_name: "",
    tenant_email: "",
    tenant_phone: "",
    start_date: "",
    end_date: "",
    rent_amount: "",
    payment_frequency: "annually",
    security_deposit: "",
    custom_terms: [...DEFAULT_TERMS],
    additional_notes: "",
    new_term: "",
  });

  const fetchData = async () => {
    if (!user) return;
    const { data: props } = await supabase
      .from("properties")
      .select("id, property_name, address, landlord_name")
      .eq("owner_user_id", user.id);

    if (!props || props.length === 0) { setLoading(false); return; }
    setProperties(props);
    const propIds = props.map((p) => p.id);

    const [{ data: leaseData }, { data: rooms }] = await Promise.all([
      supabase.from("lease_agreements").select("*").eq("landlord_user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("room_types").select("id, name, price, property_id").in("property_id", propIds),
    ]);

    setLeases((leaseData as LeaseAgreement[]) || []);
    setRoomTypes((rooms as RoomType[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handlePropertyChange = (propId: string) => {
    const filteredRooms = roomTypes.filter((r) => r.property_id === propId);
    setForm({ ...form, property_id: propId, room_type_id: "" });
  };

  const handleRoomChange = (roomId: string) => {
    const room = roomTypes.find((r) => r.id === roomId);
    setForm({
      ...form,
      room_type_id: roomId,
      rent_amount: room ? room.price.toString() : form.rent_amount,
    });
  };

  const addTerm = () => {
    if (!form.new_term.trim()) return;
    setForm({ ...form, custom_terms: [...form.custom_terms, form.new_term.trim()], new_term: "" });
  };

  const removeTerm = (idx: number) => {
    setForm({ ...form, custom_terms: form.custom_terms.filter((_, i) => i !== idx) });
  };

  const handleCreate = async () => {
    if (!form.property_id || !form.tenant_name || !form.start_date || !form.end_date || !form.rent_amount) {
      toast.error("Please fill all required fields"); return;
    }

    const { error } = await supabase.from("lease_agreements").insert({
      property_id: form.property_id,
      room_type_id: form.room_type_id || null,
      landlord_user_id: user!.id,
      tenant_name: form.tenant_name,
      tenant_email: form.tenant_email || null,
      tenant_phone: form.tenant_phone || null,
      start_date: form.start_date,
      end_date: form.end_date,
      rent_amount: parseFloat(form.rent_amount),
      payment_frequency: form.payment_frequency,
      security_deposit: parseFloat(form.security_deposit) || 0,
      custom_terms: form.custom_terms,
      additional_notes: form.additional_notes || null,
    });

    if (error) { toast.error("Failed to create lease"); return; }
    toast.success("Lease agreement created");
    setCreateOpen(false);
    setForm({ property_id: "", room_type_id: "", tenant_name: "", tenant_email: "", tenant_phone: "", start_date: "", end_date: "", rent_amount: "", payment_frequency: "annually", security_deposit: "", custom_terms: [...DEFAULT_TERMS], additional_notes: "", new_term: "" });
    fetchData();
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Lease Agreement</title>
      <style>
        body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 20px; color: #1a1a1a; line-height: 1.7; }
        h1 { text-align: center; font-size: 22px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        h2 { font-size: 16px; margin-top: 24px; color: #333; }
        .field { margin: 6px 0; } .label { font-weight: bold; }
        ul { padding-left: 20px; } li { margin: 4px 0; }
        .signature { margin-top: 60px; display: flex; justify-content: space-between; }
        .sig-block { width: 45%; border-top: 1px solid #333; padding-top: 8px; text-align: center; font-size: 14px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
      </style></head><body>${printRef.current.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getPropertyName = (id: string) => properties.find((p) => p.id === id)?.property_name || "—";
  const getProperty = (id: string) => properties.find((p) => p.id === id);
  const getRoomName = (id: string | null) => (id ? roomTypes.find((r) => r.id === id)?.name : null);
  const filteredRooms = roomTypes.filter((r) => r.property_id === form.property_id);

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5"><FileText className="h-5 w-5 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Total Leases</p><p className="text-2xl font-bold">{leases.length}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-warning/10 p-2.5"><FileText className="h-5 w-5 text-warning" /></div>
            <div><p className="text-sm text-muted-foreground">Drafts</p><p className="text-2xl font-bold text-warning">{leases.filter(l => l.status === "draft").length}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-success/10 p-2.5"><CheckCircle className="h-5 w-5 text-success" /></div>
            <div><p className="text-sm text-muted-foreground">Acknowledged</p><p className="text-2xl font-bold text-success">{leases.filter(l => l.status === "acknowledged").length}</p></div>
          </div>
        </CardContent></Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" />Create Lease</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Lease Agreement</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Property *</Label>
                <Select value={form.property_id} onValueChange={handlePropertyChange}>
                  <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                  <SelectContent>{properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {filteredRooms.length > 0 && (
                <div>
                  <Label>Room Type</Label>
                  <Select value={form.room_type_id} onValueChange={handleRoomChange}>
                    <SelectTrigger><SelectValue placeholder="Select room (optional)" /></SelectTrigger>
                    <SelectContent>{filteredRooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name} — ₦{r.price.toLocaleString()}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <Separator />
              <div><Label>Tenant Name *</Label><Input value={form.tenant_name} onChange={(e) => setForm({ ...form, tenant_name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tenant Email</Label><Input type="email" value={form.tenant_email} onChange={(e) => setForm({ ...form, tenant_email: e.target.value })} /></div>
                <div><Label>Tenant Phone</Label><Input value={form.tenant_phone} onChange={(e) => setForm({ ...form, tenant_phone: e.target.value })} /></div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Date *</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                <div><Label>End Date *</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Rent Amount (₦) *</Label><Input type="number" value={form.rent_amount} onChange={(e) => setForm({ ...form, rent_amount: e.target.value })} /></div>
                <div>
                  <Label>Payment Frequency</Label>
                  <Select value={form.payment_frequency} onValueChange={(v) => setForm({ ...form, payment_frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="biannually">Biannually</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Security Deposit (₦)</Label><Input type="number" value={form.security_deposit} onChange={(e) => setForm({ ...form, security_deposit: e.target.value })} /></div>
              <Separator />
              <div>
                <Label>Terms & Conditions</Label>
                <div className="space-y-2 mt-2">
                  {form.custom_terms.map((term, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground min-w-[20px]">{i + 1}.</span>
                      <span className="flex-1">{term}</span>
                      <Button type="button" size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => removeTerm(i)}><X className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input placeholder="Add a custom term..." value={form.new_term} onChange={(e) => setForm({ ...form, new_term: e.target.value })} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTerm())} />
                  <Button type="button" size="sm" variant="outline" onClick={addTerm}>Add</Button>
                </div>
              </div>
              <div><Label>Additional Notes</Label><Textarea value={form.additional_notes} onChange={(e) => setForm({ ...form, additional_notes: e.target.value })} rows={2} /></div>
              <Button onClick={handleCreate} className="w-full">Create Lease Agreement</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leases Table */}
      {leases.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No lease agreements yet. Create your first one!</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Lease Agreements</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leases.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <div><p className="font-medium">{l.tenant_name}</p>
                        {l.tenant_phone && <p className="text-xs text-muted-foreground">{l.tenant_phone}</p>}</div>
                      </TableCell>
                      <TableCell>{getPropertyName(l.property_id)}</TableCell>
                      <TableCell className="text-sm">{new Date(l.start_date).toLocaleDateString()} – {new Date(l.end_date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-semibold">₦{l.rent_amount.toLocaleString()}/{l.payment_frequency}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={l.status === "acknowledged" ? "bg-success/10 text-success" : l.status === "sent" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}>
                          {l.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setPreviewLease(l)}><Eye className="h-4 w-4" /></Button>
                        {l.access_token && (
                          <Button size="sm" variant="ghost" onClick={() => {
                            const url = `${window.location.origin}/lease?token=${l.access_token}`;
                            navigator.clipboard.writeText(url);
                            toast.success("Lease link copied! Share it with your tenant.");
                            // Also mark as sent
                            if (l.status === "draft") {
                              supabase.from("lease_agreements").update({ status: "sent" }).eq("id", l.id).then(() => fetchData());
                            }
                          }}>
                            <Share2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewLease} onOpenChange={(o) => !o && setPreviewLease(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Lease Agreement Preview
              <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />Print</Button>
            </DialogTitle>
          </DialogHeader>
          {previewLease && (
            <div ref={printRef}>
              <h1 style={{ textAlign: "center", fontSize: "20px", fontWeight: "bold", borderBottom: "2px solid #333", paddingBottom: "8px" }}>
                TENANCY AGREEMENT
              </h1>
              <p style={{ textAlign: "center", fontSize: "13px", marginTop: "4px" }} className="text-muted-foreground">
                Generated by MyCrib.ng
              </p>

              <h2 className="font-semibold mt-6 mb-2">Parties</h2>
              <p><strong>Landlord:</strong> {getProperty(previewLease.property_id)?.landlord_name || "—"}</p>
              <p><strong>Tenant:</strong> {previewLease.tenant_name}
                {previewLease.tenant_email && ` (${previewLease.tenant_email})`}
                {previewLease.tenant_phone && ` — ${previewLease.tenant_phone}`}
              </p>

              <h2 className="font-semibold mt-6 mb-2">Property</h2>
              <p><strong>Property:</strong> {getPropertyName(previewLease.property_id)}</p>
              <p><strong>Address:</strong> {getProperty(previewLease.property_id)?.address || "—"}</p>
              {previewLease.room_type_id && <p><strong>Room:</strong> {getRoomName(previewLease.room_type_id)}</p>}

              <h2 className="font-semibold mt-6 mb-2">Lease Details</h2>
              <p><strong>Start Date:</strong> {new Date(previewLease.start_date).toLocaleDateString()}</p>
              <p><strong>End Date:</strong> {new Date(previewLease.end_date).toLocaleDateString()}</p>
              <p><strong>Rent:</strong> ₦{previewLease.rent_amount.toLocaleString()} ({previewLease.payment_frequency})</p>
              {previewLease.security_deposit > 0 && <p><strong>Security Deposit:</strong> ₦{previewLease.security_deposit.toLocaleString()}</p>}

              <h2 className="font-semibold mt-6 mb-2">Terms & Conditions</h2>
              <ol className="list-decimal pl-5 space-y-1 text-sm">
                {previewLease.custom_terms.map((t, i) => <li key={i}>{t}</li>)}
              </ol>

              {previewLease.additional_notes && (
                <>
                  <h2 className="font-semibold mt-6 mb-2">Additional Notes</h2>
                  <p className="text-sm">{previewLease.additional_notes}</p>
                </>
              )}

              <div style={{ marginTop: "60px", display: "flex", justifyContent: "space-between" }}>
                <div style={{ width: "45%", borderTop: "1px solid #333", paddingTop: "8px", textAlign: "center" }}>
                  Landlord's Signature
                </div>
                <div style={{ width: "45%", borderTop: "1px solid #333", paddingTop: "8px", textAlign: "center" }}>
                  Tenant's Signature
                </div>
              </div>
              <p style={{ marginTop: "30px", textAlign: "center", fontSize: "11px" }} className="text-muted-foreground">
                This document was generated on {new Date(previewLease.created_at).toLocaleDateString()} via MyCrib.ng
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
