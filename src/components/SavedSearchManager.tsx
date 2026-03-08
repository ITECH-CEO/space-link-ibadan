import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Bell, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface SavedSearch {
  id: string;
  search_name: string;
  location: string | null;
  property_type: string | null;
  budget_min: number | null;
  budget_max: number | null;
  facilities: string[];
  notify_enabled: boolean;
  created_at: string;
}

const FACILITY_OPTIONS = ["Water", "Electricity", "Security", "Wi-Fi", "Generator", "Parking", "Kitchen", "Laundry"];

export function SavedSearchManager({ onClose }: { onClose?: () => void }) {
  const { user } = useAuth();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const [form, setForm] = useState({
    search_name: "",
    location: "",
    property_type: "all",
    budget_min: 10000,
    budget_max: 500000,
    facilities: [] as string[],
  });

  const fetchSearches = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setSearches((data as SavedSearch[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchSearches(); }, [user]);

  const handleCreate = async () => {
    if (!user || !form.search_name) { toast.error("Please enter a name"); return; }

    const { error } = await supabase.from("saved_searches").insert({
      user_id: user.id,
      search_name: form.search_name,
      location: form.location || null,
      property_type: form.property_type === "all" ? null : form.property_type,
      budget_min: form.budget_min,
      budget_max: form.budget_max,
      facilities: form.facilities,
    });

    if (error) { toast.error("Failed to save search"); return; }
    toast.success("Search alert saved! You'll be notified of matching properties.");
    setCreateOpen(false);
    setForm({ search_name: "", location: "", property_type: "all", budget_min: 10000, budget_max: 500000, facilities: [] });
    fetchSearches();
  };

  const toggleNotify = async (id: string, enabled: boolean) => {
    await supabase.from("saved_searches").update({ notify_enabled: enabled }).eq("id", id);
    setSearches((prev) => prev.map((s) => s.id === id ? { ...s, notify_enabled: enabled } : s));
    toast.success(enabled ? "Alerts enabled" : "Alerts paused");
  };

  const deleteSearch = async (id: string) => {
    await supabase.from("saved_searches").delete().eq("id", id);
    setSearches((prev) => prev.filter((s) => s.id !== id));
    toast.success("Search alert removed");
  };

  const toggleFacility = (f: string) => {
    setForm((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(f)
        ? prev.facilities.filter((x) => x !== f)
        : [...prev.facilities, f],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Search Alerts</h3>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" />New Alert</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Create Search Alert</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Alert Name *</Label><Input placeholder="e.g. Budget hostels near campus" value={form.search_name} onChange={(e) => setForm({ ...form, search_name: e.target.value })} /></div>
              <div><Label>Location</Label><Input placeholder="e.g. Bodija, Agbowo" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div>
                <Label>Property Type</Label>
                <Select value={form.property_type} onValueChange={(v) => setForm({ ...form, property_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Type</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="shared">Shared</SelectItem>
                    <SelectItem value="hostel">Hostel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Budget Range: ₦{form.budget_min.toLocaleString()} – ₦{form.budget_max.toLocaleString()}</Label>
                <div className="flex gap-3 mt-2">
                  <Input type="number" placeholder="Min" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: Number(e.target.value) })} />
                  <Input type="number" placeholder="Max" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label>Required Facilities</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {FACILITY_OPTIONS.map((f) => (
                    <button key={f} type="button" onClick={() => toggleFacility(f)}
                      className={`rounded-full px-3 py-1 text-xs transition-colors ${form.facilities.includes(f) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full">Save Alert</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : searches.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Search className="mx-auto h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No search alerts yet. Create one to get notified about matching properties!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {searches.map((s) => (
            <Card key={s.id}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{s.search_name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {s.location && <Badge variant="secondary" className="text-xs">{s.location}</Badge>}
                      {s.property_type && <Badge variant="secondary" className="text-xs capitalize">{s.property_type}</Badge>}
                      {s.budget_max && <Badge variant="secondary" className="text-xs">≤ ₦{s.budget_max.toLocaleString()}</Badge>}
                      {s.facilities.map((f) => <Badge key={f} variant="outline" className="text-xs">{f}</Badge>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={s.notify_enabled} onCheckedChange={(v) => toggleNotify(s.id, v)} />
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => deleteSearch(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
