import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink, Award, Building2, Banknote, Calendar } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { motion } from "framer-motion";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
  tier: string;
  sponsor_type: string;
  property_id: string | null;
  amount: number;
  start_date: string | null;
  end_date: string | null;
  payment_status: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

interface Property {
  id: string;
  property_name: string;
}

const tierColors: Record<string, string> = {
  gold: "bg-warning/10 text-warning border-warning/20",
  silver: "bg-muted text-muted-foreground border-border",
  bronze: "bg-accent/10 text-accent border-accent/20",
  platinum: "bg-primary/10 text-primary border-primary/20",
};

const tierOrder = ["platinum", "gold", "silver", "bronze"];

const emptyForm = {
  name: "", logo_url: "", website_url: "", description: "",
  tier: "bronze", sponsor_type: "platform", property_id: "",
  amount: "", start_date: "", end_date: "",
  payment_status: "pending", is_active: true, display_order: "0",
};

export function SponsorsTab() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    const [{ data: sData }, { data: pData }] = await Promise.all([
      (supabase as any).from("sponsors").select("*").order("display_order", { ascending: true }),
      supabase.from("properties").select("id, property_name").order("property_name"),
    ]);
    setSponsors(sData || []);
    setProperties(pData || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (s: Sponsor) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      logo_url: s.logo_url || "",
      website_url: s.website_url || "",
      description: s.description || "",
      tier: s.tier,
      sponsor_type: s.sponsor_type,
      property_id: s.property_id || "",
      amount: s.amount?.toString() || "0",
      start_date: s.start_date || "",
      end_date: s.end_date || "",
      payment_status: s.payment_status,
      is_active: s.is_active,
      display_order: s.display_order?.toString() || "0",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Sponsor name is required"); return; }
    setSaving(true);
    const payload: any = {
      name: form.name.trim(),
      logo_url: form.logo_url || null,
      website_url: form.website_url || null,
      description: form.description || null,
      tier: form.tier,
      sponsor_type: form.sponsor_type,
      property_id: form.property_id || null,
      amount: Number(form.amount) || 0,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      payment_status: form.payment_status,
      is_active: form.is_active,
      display_order: Number(form.display_order) || 0,
    };

    if (editingId) {
      const { error } = await (supabase as any).from("sponsors").update(payload).eq("id", editingId);
      if (error) toast.error(error.message);
      else { toast.success("Sponsor updated"); setDialogOpen(false); fetchAll(); }
    } else {
      const { error } = await (supabase as any).from("sponsors").insert(payload);
      if (error) toast.error(error.message);
      else { toast.success("Sponsor added"); setDialogOpen(false); fetchAll(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sponsor?")) return;
    const { error } = await (supabase as any).from("sponsors").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Sponsor removed"); fetchAll(); }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await (supabase as any).from("sponsors").update({ is_active: !active }).eq("id", id);
    fetchAll();
  };

  const grouped = tierOrder.reduce((acc, tier) => {
    acc[tier] = sponsors.filter(s => s.tier === tier);
    return acc;
  }, {} as Record<string, Sponsor[]>);

  const totalAmount = sponsors.reduce((s, sp) => s + sp.amount, 0);
  const paidAmount = sponsors.filter(s => s.payment_status === "paid").reduce((s, sp) => s + sp.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Sponsors & Backers</h2>
          <p className="text-sm text-muted-foreground">Manage platform and property sponsors</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gradient-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" /> Add Sponsor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Sponsor" : "Add New Sponsor"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Sponsor Name *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. GTBank" />
              </div>
              <div className="space-y-2">
                <Label>Logo</Label>
                <FileUpload bucket="property-media" folder="sponsor-logos" label="Upload Logo" currentUrl={form.logo_url || null} onUploaded={url => setForm({ ...form, logo_url: url })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tier</Label>
                  <Select value={form.tier} onValueChange={v => setForm({ ...form, tier: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="platinum">Platinum</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="bronze">Bronze</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.sponsor_type} onValueChange={v => setForm({ ...form, sponsor_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="platform">Platform Sponsor</SelectItem>
                      <SelectItem value="property">Property Sponsor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.sponsor_type === "property" && (
                <div className="space-y-2">
                  <Label>Linked Property</Label>
                  <Select value={form.property_id} onValueChange={v => setForm({ ...form, property_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                    <SelectContent>
                      {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Website URL</Label>
                <Input value={form.website_url} onChange={e => setForm({ ...form, website_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Sponsorship Amount (₦)</Label>
                  <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select value={form.payment_status} onValueChange={v => setForm({ ...form, payment_status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input type="number" value={form.display_order} onChange={e => setForm({ ...form, display_order: e.target.value })} />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                  <Label>Active</Label>
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground">
                {saving ? "Saving..." : editingId ? "Update Sponsor" : "Add Sponsor"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="card-elevated border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Sponsors</p>
            <p className="text-2xl font-bold">{sponsors.length}</p>
          </CardContent>
        </Card>
        <Card className="card-elevated border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-success">{sponsors.filter(s => s.is_active).length}</p>
          </CardContent>
        </Card>
        <Card className="card-elevated border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold text-primary">₦{totalAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="card-elevated border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="text-2xl font-bold text-success">₦{paidAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sponsors by Tier */}
      {loading ? (
        <p className="text-muted-foreground text-center py-10">Loading sponsors...</p>
      ) : sponsors.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center">
            <Award className="mx-auto h-14 w-14 text-muted-foreground/20 mb-3" />
            <h3 className="font-semibold mb-1">No Sponsors Yet</h3>
            <p className="text-sm text-muted-foreground">Add your first sponsor or backer to get started.</p>
          </CardContent>
        </Card>
      ) : (
        tierOrder.map(tier => {
          const items = grouped[tier];
          if (!items || items.length === 0) return null;
          return (
            <div key={tier}>
              <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2 capitalize">
                <Award className="h-4 w-4" /> {tier} Tier ({items.length})
              </h3>
              <div className="space-y-2">
                {items.map(s => (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className={`card-elevated border-border/50 ${!s.is_active ? "opacity-50" : ""}`}>
                      <CardContent className="p-4 flex items-center gap-4">
                        {s.logo_url ? (
                          <img src={s.logo_url} alt={s.name} className="h-12 w-12 rounded-lg object-contain bg-muted p-1" />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                            <Award className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm truncate">{s.name}</h4>
                            <Badge variant="outline" className={tierColors[s.tier] || ""}>{s.tier}</Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {s.sponsor_type === "platform" ? "Platform" : "Property"}
                            </Badge>
                            {!s.is_active && <Badge variant="outline" className="text-[10px] bg-muted">Inactive</Badge>}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <Banknote className="h-3 w-3" /> ₦{s.amount.toLocaleString()}
                            </span>
                            <Badge variant="outline" className={
                              s.payment_status === "paid" ? "bg-success/10 text-success border-success/20 text-[10px]" :
                              s.payment_status === "partial" ? "bg-warning/10 text-warning border-warning/20 text-[10px]" :
                              "text-[10px]"
                            }>
                              {s.payment_status}
                            </Badge>
                            {s.start_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {new Date(s.start_date).toLocaleDateString()} – {s.end_date ? new Date(s.end_date).toLocaleDateString() : "Ongoing"}
                              </span>
                            )}
                          </div>
                          {s.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{s.description}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {s.website_url && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={s.website_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => toggleActive(s.id, s.is_active)}>
                            <Switch checked={s.is_active} className="pointer-events-none" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
