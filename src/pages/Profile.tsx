import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VerificationBadge } from "@/components/VerificationBadge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const [client, setClient] = useState<Tables<"clients"> | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    nin: "",
    guarantor_name: "",
    guarantor_phone: "",
    guarantor_relationship: "",
    budget_min: "",
    budget_max: "",
    preferences: [] as string[],
  });

  const preferenceOptions = [
    "Quiet", "Non-Smoker", "Final Year", "Early Riser", "Night Owl",
    "Sports Lover", "Religious", "Clean Freak", "Social", "Introvert",
  ];

  useEffect(() => {
    if (!user) return;
    supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setClient(data);
          setForm({
            full_name: data.full_name,
            phone: data.phone || "",
            nin: data.nin || "",
            guarantor_name: data.guarantor_name || "",
            guarantor_phone: data.guarantor_phone || "",
            guarantor_relationship: data.guarantor_relationship || "",
            budget_min: data.budget_min?.toString() || "",
            budget_max: data.budget_max?.toString() || "",
            preferences: data.preferences || [],
          });
        }
      });
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      full_name: form.full_name,
      phone: form.phone || null,
      nin: form.nin || null,
      guarantor_name: form.guarantor_name || null,
      guarantor_phone: form.guarantor_phone || null,
      guarantor_relationship: form.guarantor_relationship || null,
      budget_min: form.budget_min ? Number(form.budget_min) : null,
      budget_max: form.budget_max ? Number(form.budget_max) : null,
      preferences: form.preferences,
      user_id: user.id,
      email: user.email,
    };

    if (client) {
      const { error } = await supabase.from("clients").update(payload).eq("id", client.id);
      if (error) toast.error(error.message);
      else toast.success("Profile updated!");
    } else {
      const { error } = await supabase.from("clients").insert(payload);
      if (error) toast.error(error.message);
      else toast.success("Profile created!");
    }
    setSaving(false);
  };

  const togglePreference = (p: string) => {
    setForm((f) => ({
      ...f,
      preferences: f.preferences.includes(p)
        ? f.preferences.filter((x) => x !== p)
        : [...f.preferences, p],
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-2xl py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold">My Profile</h1>
          {client && <VerificationBadge status={client.verification_status} />}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} />
              </div>
              <div className="space-y-2">
                <Label>NIN / Government ID</Label>
                <Input value={form.nin} onChange={(e) => setForm({ ...form, nin: e.target.value })} maxLength={20} />
              </div>
            </div>

            <h3 className="pt-4 font-display font-semibold">Guarantor Details</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.guarantor_name} onChange={(e) => setForm({ ...form, guarantor_name: e.target.value })} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.guarantor_phone} onChange={(e) => setForm({ ...form, guarantor_phone: e.target.value })} maxLength={20} />
              </div>
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Input value={form.guarantor_relationship} onChange={(e) => setForm({ ...form, guarantor_relationship: e.target.value })} maxLength={50} />
              </div>
            </div>

            <h3 className="pt-4 font-display font-semibold">Budget (₦)</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Min Budget</Label>
                <Input type="number" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Max Budget</Label>
                <Input type="number" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} />
              </div>
            </div>

            <h3 className="pt-4 font-display font-semibold">Preferences / Tags</h3>
            <div className="flex flex-wrap gap-2">
              {preferenceOptions.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePreference(p)}
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    form.preferences.includes(p)
                      ? "gradient-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <Button onClick={handleSave} disabled={saving} className="mt-6 gradient-primary text-primary-foreground">
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
