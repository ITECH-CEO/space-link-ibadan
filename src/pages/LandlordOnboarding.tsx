import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/FileUpload";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { toast } from "sonner";
import { Building2, User, Camera, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";

const steps = [
  { title: "Your Details", icon: User, desc: "Tell us about yourself" },
  { title: "Property Info", icon: Building2, desc: "Describe your property" },
  { title: "Photos & Review", icon: Camera, desc: "Upload photos and submit" },
];

export default function LandlordOnboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    landlord_name: "", landlord_phone: "", landlord_email: "",
    property_name: "", address: "", location: "",
    property_type: "single" as "shared" | "single" | "hostel",
    total_rooms: "", proximity_to_campus: "",
    facilities: [] as string[], special_notes: "",
    photos: [] as string[],
  });

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const facilityOptions = [
    "WiFi", "Water", "Electricity", "Security", "Parking",
    "Kitchen", "Bathroom (Ensuite)", "Laundry", "Generator", "CCTV",
  ];

  const toggleFacility = (f: string) => {
    setForm((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(f)
        ? prev.facilities.filter((x) => x !== f)
        : [...prev.facilities, f],
    }));
  };

  const canNext = () => {
    if (step === 0) return form.landlord_name && form.landlord_phone;
    if (step === 1) return form.property_name && form.address && form.total_rooms;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const { error } = await supabase.from("properties").insert({
      landlord_name: form.landlord_name,
      landlord_phone: form.landlord_phone || null,
      landlord_email: form.landlord_email || null,
      property_name: form.property_name,
      address: form.address,
      location: form.location || null,
      property_type: form.property_type,
      total_rooms: Number(form.total_rooms) || 0,
      available_rooms: Number(form.total_rooms) || 0,
      proximity_to_campus: form.proximity_to_campus || null,
      facilities: form.facilities,
      special_notes: form.special_notes || null,
      photos: form.photos,
      owner_user_id: user.id,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Property submitted for verification! Our team will review it shortly.");
      navigate("/landlord");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-2xl py-8">
        <h1 className="font-display text-3xl font-bold mb-2">Register Your Property</h1>
        <p className="text-muted-foreground mb-8">List your property on UNISPACE.NG and reach thousands of verified students.</p>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s.title} className="flex items-center gap-2 flex-1">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors ${i <= step ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {i < step ? <CheckCircle className="h-5 w-5" /> : i + 1}
              </div>
              <div className="hidden sm:block">
                <p className={`text-sm font-medium ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => { const Icon = steps[step].icon; return <Icon className="h-5 w-5 text-primary" />; })()}
              {steps[step].title}
            </CardTitle>
            <CardDescription>{steps[step].desc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 0 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Your Full Name *</Label>
                    <Input value={form.landlord_name} onChange={(e) => setForm({ ...form, landlord_name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <Input value={form.landlord_phone} onChange={(e) => setForm({ ...form, landlord_phone: e.target.value })} placeholder="+234..." required />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Email</Label>
                    <Input type="email" value={form.landlord_email} onChange={(e) => setForm({ ...form, landlord_email: e.target.value })} />
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Property Name *</Label>
                    <Input value={form.property_name} onChange={(e) => setForm({ ...form, property_name: e.target.value })} placeholder="e.g. Sunshine Hostel" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Property Type</Label>
                    <Select value={form.property_type} onValueChange={(v: any) => setForm({ ...form, property_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single Room</SelectItem>
                        <SelectItem value="shared">Shared Room</SelectItem>
                        <SelectItem value="hostel">Hostel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Address *</Label>
                    <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Location / Area</Label>
                    <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Agbowo, UI" />
                  </div>
                  <div className="space-y-2">
                    <Label>Proximity to Campus</Label>
                    <Input value={form.proximity_to_campus} onChange={(e) => setForm({ ...form, proximity_to_campus: e.target.value })} placeholder="e.g. 5 min walk" />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Rooms *</Label>
                    <Input type="number" value={form.total_rooms} onChange={(e) => setForm({ ...form, total_rooms: e.target.value })} required />
                  </div>
                </div>
                <h3 className="pt-2 font-display font-semibold text-sm">Facilities</h3>
                <div className="flex flex-wrap gap-2">
                  {facilityOptions.map((f) => (
                    <button key={f} onClick={() => toggleFacility(f)} className={`rounded-full px-3 py-1 text-sm transition-colors ${form.facilities.includes(f) ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                      {f}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Special Notes</Label>
                  <Textarea value={form.special_notes} onChange={(e) => setForm({ ...form, special_notes: e.target.value })} placeholder="Any additional info about the property..." rows={3} />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-sm text-muted-foreground mb-4">Upload photos of your property (exterior, rooms, facilities). This helps students and speeds up verification.</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <FileUpload
                      key={i}
                      bucket="property-media"
                      folder="property-photos"
                      label={`Photo ${i + 1}`}
                      currentUrl={form.photos[i] || null}
                      onUploaded={(url) => {
                        const newPhotos = [...form.photos];
                        newPhotos[i] = url;
                        setForm({ ...form, photos: newPhotos.filter(Boolean) });
                      }}
                    />
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-6 rounded-lg bg-muted/50 p-4 space-y-2">
                  <h4 className="font-semibold">Review Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Name:</span><span>{form.landlord_name}</span>
                    <span className="text-muted-foreground">Property:</span><span>{form.property_name}</span>
                    <span className="text-muted-foreground">Address:</span><span>{form.address}</span>
                    <span className="text-muted-foreground">Type:</span><span className="capitalize">{form.property_type}</span>
                    <span className="text-muted-foreground">Rooms:</span><span>{form.total_rooms}</span>
                    <span className="text-muted-foreground">Photos:</span><span>{form.photos.filter(Boolean).length} uploaded</span>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-between pt-4">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              )}
              <div className="ml-auto">
                {step < 2 ? (
                  <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="gradient-primary text-primary-foreground">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={submitting} className="gradient-primary text-primary-foreground">
                    {submitting ? "Submitting..." : "Submit Property"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <WhatsAppButton />
    </div>
  );
}
