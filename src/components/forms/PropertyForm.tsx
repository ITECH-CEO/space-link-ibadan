import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const facilityOptions = ["Water", "Electricity", "Security", "Wi-Fi", "Generator", "Parking", "Kitchen", "Laundry"];

export function PropertyForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    landlord_name: "",
    landlord_phone: "",
    landlord_email: "",
    property_name: "",
    property_type: "single" as "shared" | "single" | "hostel",
    address: "",
    location: "",
    proximity_to_campus: "",
    total_rooms: "",
    available_rooms: "",
    facilities: [] as string[],
    special_notes: "",
  });
  const [saving, setSaving] = useState(false);

  const toggleFacility = (f: string) => {
    setForm((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(f)
        ? prev.facilities.filter((x) => x !== f)
        : [...prev.facilities, f],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("properties").insert({
      landlord_name: form.landlord_name,
      landlord_phone: form.landlord_phone || null,
      landlord_email: form.landlord_email || null,
      property_name: form.property_name,
      property_type: form.property_type,
      address: form.address,
      location: form.location || null,
      proximity_to_campus: form.proximity_to_campus || null,
      total_rooms: form.total_rooms ? Number(form.total_rooms) : 0,
      available_rooms: form.available_rooms ? Number(form.available_rooms) : 0,
      facilities: form.facilities,
      special_notes: form.special_notes || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Property added!"); onSuccess(); }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Landlord Name *</Label>
          <Input value={form.landlord_name} onChange={(e) => setForm({ ...form, landlord_name: e.target.value })} required maxLength={100} />
        </div>
        <div className="space-y-2">
          <Label>Landlord Phone</Label>
          <Input value={form.landlord_phone} onChange={(e) => setForm({ ...form, landlord_phone: e.target.value })} maxLength={20} />
        </div>
        <div className="space-y-2">
          <Label>Landlord Email</Label>
          <Input type="email" value={form.landlord_email} onChange={(e) => setForm({ ...form, landlord_email: e.target.value })} maxLength={255} />
        </div>
        <div className="space-y-2">
          <Label>Property Name *</Label>
          <Input value={form.property_name} onChange={(e) => setForm({ ...form, property_name: e.target.value })} required maxLength={100} />
        </div>
        <div className="space-y-2">
          <Label>Property Type *</Label>
          <Select value={form.property_type} onValueChange={(v) => setForm({ ...form, property_type: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="shared">Shared</SelectItem>
              <SelectItem value="hostel">Hostel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Address *</Label>
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required maxLength={200} />
        </div>
        <div className="space-y-2">
          <Label>Location</Label>
          <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Bodija, Agbowo" maxLength={100} />
        </div>
        <div className="space-y-2">
          <Label>Proximity to Campus</Label>
          <Input value={form.proximity_to_campus} onChange={(e) => setForm({ ...form, proximity_to_campus: e.target.value })} placeholder="e.g. 5 min walk" maxLength={100} />
        </div>
        <div className="space-y-2">
          <Label>Total Rooms</Label>
          <Input type="number" value={form.total_rooms} onChange={(e) => setForm({ ...form, total_rooms: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Available Rooms</Label>
          <Input type="number" value={form.available_rooms} onChange={(e) => setForm({ ...form, available_rooms: e.target.value })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Facilities</Label>
        <div className="flex flex-wrap gap-2">
          {facilityOptions.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => toggleFacility(f)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                form.facilities.includes(f)
                  ? "gradient-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Special Notes</Label>
        <Textarea value={form.special_notes} onChange={(e) => setForm({ ...form, special_notes: e.target.value })} maxLength={500} />
      </div>

      <Button type="submit" disabled={saving} className="w-full gradient-primary text-primary-foreground">
        {saving ? "Saving..." : "Add Property"}
      </Button>
    </form>
  );
}
