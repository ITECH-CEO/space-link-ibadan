import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Upload, X, Image, Video, RotateCcw } from "lucide-react";

const facilityOptions = ["Water", "Electricity", "Security", "Wi-Fi", "Generator", "Parking", "Kitchen", "Laundry"];

interface RoomTypeInput {
  name: string;
  price: string;
  available_count: string;
  description: string;
  features: string[];
}

const emptyRoomType = (): RoomTypeInput => ({
  name: "",
  price: "",
  available_count: "",
  description: "",
  features: [],
});

const featureOptions = ["AC", "Fan", "Wardrobe", "En-suite", "Balcony", "Furnished", "Tiled", "POP Ceiling"];

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
    distance_to_campus_km: "",
    walkability_rating: "",
    power_rating: "",
    water_rating: "",
    transport_options: [{ mode: "", duration: "", cost_estimate: "" }] as { mode: string; duration: string; cost_estimate: string }[],
  });

  const [roomTypes, setRoomTypes] = useState<RoomTypeInput[]>([emptyRoomType()]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [panoramas, setPanoramas] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const toggleFacility = (f: string) => {
    setForm((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(f)
        ? prev.facilities.filter((x) => x !== f)
        : [...prev.facilities, f],
    }));
  };

  const updateRoomType = (index: number, field: keyof RoomTypeInput, value: any) => {
    setRoomTypes((prev) => prev.map((rt, i) => (i === index ? { ...rt, [field]: value } : rt)));
  };

  const toggleRoomFeature = (index: number, feature: string) => {
    setRoomTypes((prev) =>
      prev.map((rt, i) =>
        i === index
          ? {
              ...rt,
              features: rt.features.includes(feature)
                ? rt.features.filter((f) => f !== feature)
                : [...rt.features, feature],
            }
          : rt
      )
    );
  };

  const addRoomType = () => setRoomTypes((prev) => [...prev, emptyRoomType()]);
  const removeRoomType = (index: number) => {
    if (roomTypes.length <= 1) return;
    setRoomTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024);
    if (valid.length !== files.length) toast.error("Some files skipped (must be images under 5MB)");
    setPhotos((prev) => [...prev, ...valid].slice(0, 10));
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => f.type.startsWith("video/") && f.size <= 50 * 1024 * 1024);
    if (valid.length !== files.length) toast.error("Some files skipped (must be videos under 50MB)");
    setVideos((prev) => [...prev, ...valid].slice(0, 3));
  };

  const handlePanoramaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024);
    if (valid.length !== files.length) toast.error("Some files skipped (must be images under 10MB)");
    setPanoramas((prev) => [...prev, ...valid].slice(0, 5));
  };

  const uploadFiles = async (files: File[], folder: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      setUploadProgress(`Uploading ${file.name}...`);
      const { error } = await supabase.storage.from("property-media").upload(path, file);
      if (error) {
        toast.error(`Upload failed: ${file.name}`);
        continue;
      }
      const { data: urlData } = supabase.storage.from("property-media").getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Upload media
      let photoUrls: string[] = [];
      let videoUrls: string[] = [];

      if (photos.length > 0) {
        photoUrls = await uploadFiles(photos, "photos");
      }
      if (videos.length > 0) {
        videoUrls = await uploadFiles(videos, "videos");
      }

      setUploadProgress("");

      // Insert property
      const { data: property, error } = await supabase
        .from("properties")
        .insert({
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
          photos: photoUrls,
          videos: videoUrls,
          distance_to_campus_km: form.distance_to_campus_km ? Number(form.distance_to_campus_km) : null,
          walkability_rating: form.walkability_rating ? Number(form.walkability_rating) : null,
          utility_rating: (form.power_rating || form.water_rating) ? {
            power: form.power_rating ? Number(form.power_rating) : null,
            water: form.water_rating ? Number(form.water_rating) : null,
          } : null,
          transport_options: form.transport_options.filter(t => t.mode).map(t => ({
            mode: t.mode,
            duration: t.duration || null,
            cost_estimate: t.cost_estimate || null,
          })),
        } as any)
        .select("id")
        .single();

      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }

      // Insert room types
      const validRoomTypes = roomTypes.filter((rt) => rt.name.trim() && rt.price);
      if (validRoomTypes.length > 0 && property) {
        const { error: rtError } = await supabase.from("room_types").insert(
          validRoomTypes.map((rt) => ({
            property_id: property.id,
            name: rt.name.trim(),
            price: Number(rt.price),
            available_count: rt.available_count ? Number(rt.available_count) : 0,
            description: rt.description || null,
            features: rt.features,
          }))
        );
        if (rtError) toast.error(`Room types error: ${rtError.message}`);
      }

      toast.success("Property added with room types!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSaving(false);
      setUploadProgress("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Landlord Info */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Landlord Info</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Landlord Name *</Label>
            <Input value={form.landlord_name} onChange={(e) => setForm({ ...form, landlord_name: e.target.value })} required maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label>Landlord Phone</Label>
            <Input value={form.landlord_phone} onChange={(e) => setForm({ ...form, landlord_phone: e.target.value })} maxLength={20} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Landlord Email</Label>
            <Input type="email" value={form.landlord_email} onChange={(e) => setForm({ ...form, landlord_email: e.target.value })} maxLength={255} />
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Property Details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="space-y-2 sm:col-span-2">
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
      </div>

      {/* Location & Transport */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Location & Transport</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Distance to Campus (km)</Label>
            <Input type="number" step="0.1" value={form.distance_to_campus_km} onChange={(e) => setForm({ ...form, distance_to_campus_km: e.target.value })} placeholder="e.g. 1.5" />
          </div>
          <div className="space-y-2">
            <Label>Walkability Rating (1-5)</Label>
            <Select value={form.walkability_rating} onValueChange={(v) => setForm({ ...form, walkability_rating: v })}>
              <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} — {["Poor","Fair","Good","Very Good","Excellent"][n-1]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Power Reliability (1-5)</Label>
            <Select value={form.power_rating} onValueChange={(v) => setForm({ ...form, power_rating: v })}>
              <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} — {["Poor","Fair","Good","Very Good","Excellent"][n-1]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Water Reliability (1-5)</Label>
            <Select value={form.water_rating} onValueChange={(v) => setForm({ ...form, water_rating: v })}>
              <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} — {["Poor","Fair","Good","Very Good","Excellent"][n-1]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Transport Options */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label>Transport Options (to campus)</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => setForm(prev => ({ ...prev, transport_options: [...prev.transport_options, { mode: "", duration: "", cost_estimate: "" }] }))}>
              <Plus className="mr-1 h-3 w-3" />Add
            </Button>
          </div>
          {form.transport_options.map((t, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 items-end">
              <Select value={t.mode} onValueChange={(v) => { const opts = [...form.transport_options]; opts[i].mode = v; setForm({ ...form, transport_options: opts }); }}>
                <SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk">Walk</SelectItem>
                  <SelectItem value="bike">Bike/Okada</SelectItem>
                  <SelectItem value="bus">Bus/Danfo</SelectItem>
                  <SelectItem value="car">Car/Taxi</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Duration" value={t.duration} onChange={(e) => { const opts = [...form.transport_options]; opts[i].duration = e.target.value; setForm({ ...form, transport_options: opts }); }} />
              <Input placeholder="₦ Cost" value={t.cost_estimate} onChange={(e) => { const opts = [...form.transport_options]; opts[i].cost_estimate = e.target.value; setForm({ ...form, transport_options: opts }); }} />
              {form.transport_options.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setForm(prev => ({ ...prev, transport_options: prev.transport_options.filter((_, j) => j !== i) }))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Facilities */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Facilities</h3>
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

      {/* Media Upload */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Media</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Photos */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Image className="h-4 w-4" />Photos (max 10)</Label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input p-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <Upload className="h-4 w-4" />
              Click to upload photos
              <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />
            </label>
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {photos.map((f, i) => (
                  <div key={i} className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">
                    <span className="truncate max-w-[100px]">{f.name}</span>
                    <button type="button" onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Videos */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Video className="h-4 w-4" />Videos (max 3)</Label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input p-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <Upload className="h-4 w-4" />
              Click to upload videos
              <input type="file" accept="video/*" multiple onChange={handleVideoSelect} className="hidden" />
            </label>
            {videos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {videos.map((f, i) => (
                  <div key={i} className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">
                    <span className="truncate max-w-[100px]">{f.name}</span>
                    <button type="button" onClick={() => setVideos((prev) => prev.filter((_, j) => j !== i))}>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Room Types */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Room Types</h3>
          <Button type="button" variant="outline" size="sm" onClick={addRoomType}>
            <Plus className="mr-1 h-3 w-3" />Add Room
          </Button>
        </div>
        <div className="space-y-4">
          {roomTypes.map((rt, index) => (
            <div key={index} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Room Type {index + 1}</span>
                {roomTypes.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeRoomType(index)} className="h-7 w-7 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name *</Label>
                  <Input
                    placeholder="e.g. Single Room"
                    value={rt.name}
                    onChange={(e) => updateRoomType(index, "name", e.target.value)}
                    maxLength={50}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Price (₦) *</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 150000"
                    value={rt.price}
                    onChange={(e) => updateRoomType(index, "price", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Available</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 5"
                    value={rt.available_count}
                    onChange={(e) => updateRoomType(index, "available_count", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Input
                  placeholder="Short description..."
                  value={rt.description}
                  onChange={(e) => updateRoomType(index, "description", e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Features</Label>
                <div className="flex flex-wrap gap-1.5">
                  {featureOptions.map((feat) => (
                    <button
                      key={feat}
                      type="button"
                      onClick={() => toggleRoomFeature(index, feat)}
                      className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                        rt.features.includes(feat)
                          ? "gradient-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {feat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Special Notes */}
      <div className="space-y-2">
        <Label>Special Notes</Label>
        <Textarea value={form.special_notes} onChange={(e) => setForm({ ...form, special_notes: e.target.value })} maxLength={500} />
      </div>

      {uploadProgress && <p className="text-sm text-muted-foreground animate-pulse">{uploadProgress}</p>}

      <Button type="submit" disabled={saving} className="w-full gradient-primary text-primary-foreground">
        {saving ? "Saving..." : "Add Property"}
      </Button>
    </form>
  );
}
