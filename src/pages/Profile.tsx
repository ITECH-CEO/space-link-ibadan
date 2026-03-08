import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { VerificationBadge } from "@/components/VerificationBadge";
import { FileUpload } from "@/components/FileUpload";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { toast } from "sonner";
import { Shield, FileText, GraduationCap, Users } from "lucide-react";
import { ReferralCard } from "@/components/ReferralCard";
import { motion } from "framer-motion";

const preferenceOptions = [
  "Quiet", "Non-Smoker", "Final Year", "Early Riser", "Night Owl",
  "Sports Lover", "Religious", "Clean Freak", "Social", "Introvert",
];

const faculties = [
  "Arts", "Science", "Social Sciences", "Education", "Engineering",
  "Law", "Medicine", "Agriculture", "Pharmacy", "Technology",
  "Environmental Sciences", "Management Sciences", "Communication",
];

const levels = ["100", "200", "300", "400", "500", "600", "Postgraduate"];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const [client, setClient] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "", phone: "", nin: "",
    guarantor_name: "", guarantor_phone: "", guarantor_relationship: "",
    budget_min: "", budget_max: "",
    preferences: [] as string[],
    government_id_url: "", proof_of_admission_url: "", current_photo_url: "",
    course: "", faculty: "", level: "",
    seeking_roommate: false,
    gender: "",
  });

  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setClient(data);
          setForm({
            full_name: data.full_name,
            phone: data.phone || "", nin: data.nin || "",
            guarantor_name: data.guarantor_name || "",
            guarantor_phone: data.guarantor_phone || "",
            guarantor_relationship: data.guarantor_relationship || "",
            budget_min: data.budget_min?.toString() || "",
            budget_max: data.budget_max?.toString() || "",
            preferences: data.preferences || [],
            government_id_url: data.government_id_url || "",
            proof_of_admission_url: data.proof_of_admission_url || "",
            current_photo_url: data.current_photo_url || "",
            course: data.course || "", faculty: data.faculty || "", level: data.level || "",
            seeking_roommate: data.seeking_roommate || false,
            gender: data.gender || "",
          });
        }
      });
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const handleSave = async () => {
    if (!form.gender) {
      toast.error("Gender is required");
      return;
    }
    setSaving(true);
    const payload: any = {
      full_name: form.full_name,
      phone: form.phone || null, nin: form.nin || null,
      guarantor_name: form.guarantor_name || null,
      guarantor_phone: form.guarantor_phone || null,
      guarantor_relationship: form.guarantor_relationship || null,
      budget_min: form.budget_min ? Number(form.budget_min) : null,
      budget_max: form.budget_max ? Number(form.budget_max) : null,
      preferences: form.preferences,
      government_id_url: form.government_id_url || null,
      proof_of_admission_url: form.proof_of_admission_url || null,
      current_photo_url: form.current_photo_url || null,
      course: form.course || null, faculty: form.faculty || null, level: form.level || null,
      seeking_roommate: form.seeking_roommate,
      gender: form.gender || null,
      user_id: user.id, email: user.email,
    };

    if (client) {
      const { error } = await (supabase as any).from("clients").update(payload).eq("id", client.id);
      if (error) toast.error(error.message);
      else toast.success("Profile updated!");
    } else {
      const { error } = await (supabase as any).from("clients").insert(payload);
      if (error) toast.error(error.message);
      else toast.success("Profile created!");
    }
    setSaving(false);
  };

  const togglePreference = (p: string) => {
    setForm((f) => ({
      ...f,
      preferences: f.preferences.includes(p) ? f.preferences.filter((x) => x !== p) : [...f.preferences, p],
    }));
  };

  const verificationSteps = [
    { label: "Full Name", done: !!form.full_name },
    { label: "Gender", done: !!form.gender },
    { label: "Phone Number", done: !!form.phone },
    { label: "NIN / Gov ID Number", done: !!form.nin },
    { label: "Government ID Upload", done: !!form.government_id_url },
    { label: "Proof of Admission", done: !!form.proof_of_admission_url },
    { label: "Current Photo", done: !!form.current_photo_url },
    { label: "Guarantor Name", done: !!form.guarantor_name },
    { label: "Guarantor Phone", done: !!form.guarantor_phone },
    { label: "Course & Faculty", done: !!form.course && !!form.faculty },
    { label: "Budget Range", done: !!form.budget_min && !!form.budget_max },
  ];
  const completedSteps = verificationSteps.filter((s) => s.done).length;
  const progressPercent = Math.round((completedSteps / verificationSteps.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-2xl py-8">
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp} className="mb-6 flex items-center justify-between">
            <h1 className="font-display text-3xl font-bold">My Profile</h1>
            {client && <VerificationBadge status={client.verification_status} />}
          </motion.div>

          {/* Verification Progress */}
          <motion.div variants={fadeUp}>
            <Card className="mb-6 card-elevated border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="font-display font-semibold">Verification Progress</h3>
                  <span className="ml-auto text-sm font-medium text-primary">{progressPercent}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full gradient-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-1">
                  {verificationSteps.map((s) => (
                    <div key={s.label} className={`text-xs flex items-center gap-1 ${s.done ? "text-success" : "text-muted-foreground"}`}>
                      <span>{s.done ? "✓" : "○"}</span> {s.label}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="mb-6 card-elevated border-border/50">
              <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender <span className="text-destructive">*</span></Label>
                    <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                      <SelectTrigger className={!form.gender ? "border-destructive/50" : ""}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} />
                  </div>
                  <div className="space-y-2">
                    <Label>NIN / Government ID Number</Label>
                    <Input value={form.nin} onChange={(e) => setForm({ ...form, nin: e.target.value })} maxLength={20} />
                  </div>
                </div>

                <h3 className="pt-4 font-display font-semibold flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" /> Academic Information
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Faculty</Label>
                    <Select value={form.faculty} onValueChange={(v) => setForm({ ...form, faculty: v })}>
                      <SelectTrigger><SelectValue placeholder="Select faculty" /></SelectTrigger>
                      <SelectContent>
                        {faculties.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Course</Label>
                    <Input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} placeholder="e.g. Computer Science" maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label>Level</Label>
                    <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                      <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                      <SelectContent>
                        {levels.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <h3 className="pt-4 font-display font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Verification Documents
                </h3>
                <p className="text-xs text-muted-foreground">Upload clear photos of your documents. Max 5MB each.</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <FileUpload bucket="client-documents" folder={user.id} label="Government ID" currentUrl={form.government_id_url || null} onUploaded={(url) => setForm({ ...form, government_id_url: url })} />
                  <FileUpload bucket="client-documents" folder={user.id} label="Proof of Admission" currentUrl={form.proof_of_admission_url || null} onUploaded={(url) => setForm({ ...form, proof_of_admission_url: url })} />
                  <FileUpload bucket="client-documents" folder={user.id} label="Current Photo" currentUrl={form.current_photo_url || null} onUploaded={(url) => setForm({ ...form, current_photo_url: url })} />
                </div>

                <h3 className="pt-4 font-display font-semibold">Guarantor Details</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2"><Label>Name</Label><Input value={form.guarantor_name} onChange={(e) => setForm({ ...form, guarantor_name: e.target.value })} maxLength={100} /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input value={form.guarantor_phone} onChange={(e) => setForm({ ...form, guarantor_phone: e.target.value })} maxLength={20} /></div>
                  <div className="space-y-2"><Label>Relationship</Label><Input value={form.guarantor_relationship} onChange={(e) => setForm({ ...form, guarantor_relationship: e.target.value })} maxLength={50} /></div>
                </div>

                <h3 className="pt-4 font-display font-semibold">Budget (₦)</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Min Budget</Label><Input type="number" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Max Budget</Label><Input type="number" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} /></div>
                </div>

                <h3 className="pt-4 font-display font-semibold">Preferences / Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {preferenceOptions.map((p) => (
                    <motion.button
                      key={p}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => togglePreference(p)}
                      className={`rounded-full px-3 py-1 text-sm transition-colors ${form.preferences.includes(p) ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                    >
                      {p}
                    </motion.button>
                  ))}
                </div>

                <Card className="mt-4 border-primary/20 card-elevated">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-semibold text-sm">Looking for a Roommate?</h4>
                          <p className="text-xs text-muted-foreground">Enable this to be matched with compatible roommates based on your course, faculty, and preferences.</p>
                        </div>
                      </div>
                      <Switch checked={form.seeking_roommate} onCheckedChange={(v) => setForm({ ...form, seeking_roommate: v })} />
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={handleSave} disabled={saving} className="mt-6 gradient-primary text-primary-foreground">
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <ReferralCard />
          </motion.div>
        </motion.div>
      </main>
      <WhatsAppButton />
    </div>
  );
}
