import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, GraduationCap, Heart, Search, Check, ArrowRight, ArrowLeft, Loader2, Sparkles,
} from "lucide-react";

const STEPS = [
  { label: "About You", icon: User, description: "Basic personal info" },
  { label: "Academics", icon: GraduationCap, description: "School details" },
  { label: "Preferences", icon: Heart, description: "What you're looking for" },
  { label: "Let's Go!", icon: Search, description: "Find your crib" },
];

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

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: user?.user_metadata?.full_name || "",
    gender: "",
    phone: "",
    faculty: "",
    course: "",
    level: "",
    budget_min: 50000,
    budget_max: 200000,
    preferences: [] as string[],
    seeking_roommate: false,
  });

  const togglePref = (p: string) =>
    setForm((f) => ({
      ...f,
      preferences: f.preferences.includes(p) ? f.preferences.filter((x) => x !== p) : [...f.preferences, p],
    }));

  const canProceed = () => {
    if (step === 0) return !!form.full_name && !!form.gender;
    return true;
  };

  const next = () => {
    if (!canProceed()) {
      toast.error("Please fill in the required fields");
      return;
    }
    setDirection(1);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const back = () => {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await (supabase as any).from("clients").insert({
      user_id: user.id,
      email: user.email,
      full_name: form.full_name,
      gender: form.gender || null,
      phone: form.phone || null,
      faculty: form.faculty || null,
      course: form.course || null,
      level: form.level || null,
      budget_min: form.budget_min,
      budget_max: form.budget_max,
      preferences: form.preferences,
      seeking_roommate: form.seeking_roommate,
    });

    if (error) {
      if (error.code === "23505") {
        toast.success("Welcome back!");
      } else {
        toast.error(error.message);
        setSaving(false);
        return;
      }
    } else {
      toast.success("Profile created! Let's find your perfect crib 🏠");
    }

    setSaving(false);
    const params = new URLSearchParams();
    if (form.budget_max) params.set("budget", String(form.budget_max));
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-xl py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold">Welcome to MyCrib 🎉</h1>
            <p className="text-muted-foreground mt-1">Let's set up your profile in under 2 minutes</p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between mb-8 px-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <div key={i} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1">
                    <motion.button
                      whileHover={i < step ? { scale: 1.1 } : {}}
                      whileTap={i < step ? { scale: 0.95 } : {}}
                      onClick={() => { if (i < step) { setDirection(-1); setStep(i); } }}
                      disabled={i > step}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                        isDone ? "border-primary gradient-primary text-primary-foreground cursor-pointer" :
                        isActive ? "border-primary bg-primary/10 text-primary glow-primary" :
                        "border-muted-foreground/20 text-muted-foreground/40 cursor-default"
                      )}
                    >
                      {isDone ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </motion.button>
                    <span className={cn(
                      "text-[10px] font-medium hidden sm:block",
                      isActive || isDone ? "text-foreground" : "text-muted-foreground/40"
                    )}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn("mx-1 sm:mx-3 h-0.5 flex-1 rounded-full transition-colors", isDone ? "bg-primary" : "bg-muted-foreground/15")} />
                  )}
                </div>
              );
            })}
          </div>

          <Card className="card-elevated border-border/50 overflow-hidden">
            <CardContent className="pt-6 pb-8">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {step === 0 && (
                    <div className="space-y-5">
                      <div className="text-center mb-2">
                        <h2 className="font-display text-xl font-semibold">Tell us about yourself</h2>
                        <p className="text-sm text-muted-foreground">This helps us find the best accommodation for you</p>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Full Name <span className="text-destructive">*</span></Label>
                          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Your full name" maxLength={100} />
                        </div>
                        <div className="space-y-2">
                          <Label>Gender <span className="text-destructive">*</span></Label>
                          <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                            <SelectTrigger className={!form.gender ? "border-destructive/40" : ""}>
                              <SelectValue placeholder="Select your gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Phone Number</Label>
                          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="080xxxxxxxx" maxLength={20} />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-5">
                      <div className="text-center mb-2">
                        <h2 className="font-display text-xl font-semibold">Academic Details</h2>
                        <p className="text-sm text-muted-foreground">Helps match you with nearby properties and compatible roommates</p>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Faculty</Label>
                          <Select value={form.faculty} onValueChange={(v) => setForm({ ...form, faculty: v })}>
                            <SelectTrigger><SelectValue placeholder="Select your faculty" /></SelectTrigger>
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
                            <SelectTrigger><SelectValue placeholder="Select your level" /></SelectTrigger>
                            <SelectContent>
                              {levels.map((l) => <SelectItem key={l} value={l}>{l} Level</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-5">
                      <div className="text-center mb-2">
                        <h2 className="font-display text-xl font-semibold">Your Preferences</h2>
                        <p className="text-sm text-muted-foreground">Set your budget and lifestyle preferences</p>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <Label>
                            Budget Range: <span className="text-primary font-semibold">₦{form.budget_min.toLocaleString()}</span> — <span className="text-primary font-semibold">₦{form.budget_max.toLocaleString()}</span>
                          </Label>
                          <Slider
                            value={[form.budget_min, form.budget_max]}
                            onValueChange={([min, max]) => setForm({ ...form, budget_min: min, budget_max: max })}
                            min={10000} max={500000} step={5000}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>₦10,000</span><span>₦500,000</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Lifestyle Tags (select all that apply)</Label>
                          <div className="flex flex-wrap gap-2">
                            {preferenceOptions.map((p) => (
                              <motion.button
                                key={p}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => togglePref(p)}
                                className={cn(
                                  "rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                                  form.preferences.includes(p)
                                    ? "gradient-primary text-primary-foreground shadow-sm"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                )}
                              >
                                {p}
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg border border-primary/20 p-4 flex items-center justify-between card-elevated">
                          <div className="flex items-center gap-3">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm font-semibold">Looking for a roommate?</p>
                              <p className="text-xs text-muted-foreground">We'll match you with compatible people</p>
                            </div>
                          </div>
                          <Switch checked={form.seeking_roommate} onCheckedChange={(v) => setForm({ ...form, seeking_roommate: v })} />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-5">
                      <div className="text-center mb-4">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 15 }}
                          className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
                        >
                          <Search className="h-8 w-8 text-primary" />
                        </motion.div>
                        <h2 className="font-display text-xl font-semibold">You're all set! 🎊</h2>
                        <p className="text-sm text-muted-foreground mt-1">Here's a summary of your profile</p>
                      </div>

                      <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{form.full_name}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Gender</span><span className="font-medium capitalize">{form.gender}</span></div>
                        {form.faculty && <div className="flex justify-between"><span className="text-muted-foreground">Faculty</span><span className="font-medium">{form.faculty}</span></div>}
                        {form.course && <div className="flex justify-between"><span className="text-muted-foreground">Course</span><span className="font-medium">{form.course}</span></div>}
                        {form.level && <div className="flex justify-between"><span className="text-muted-foreground">Level</span><span className="font-medium">{form.level}</span></div>}
                        <div className="flex justify-between"><span className="text-muted-foreground">Budget</span><span className="font-medium">₦{form.budget_min.toLocaleString()} — ₦{form.budget_max.toLocaleString()}</span></div>
                        {form.preferences.length > 0 && (
                          <div className="flex justify-between items-start">
                            <span className="text-muted-foreground">Tags</span>
                            <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                              {form.preferences.map((p) => (
                                <span key={p} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-medium">{p}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between"><span className="text-muted-foreground">Roommate</span><span className="font-medium">{form.seeking_roommate ? "Yes" : "No"}</span></div>
                      </div>

                      <p className="text-xs text-muted-foreground text-center">
                        You can always update your profile and upload verification documents later from the Profile page.
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                {step > 0 ? (
                  <Button variant="ghost" onClick={back}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                ) : (
                  <div />
                )}

                {step < STEPS.length - 1 ? (
                  <Button onClick={next} disabled={!canProceed()} className="gradient-primary text-primary-foreground">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleFinish} disabled={saving} className="gradient-accent text-accent-foreground font-semibold min-w-[180px]">
                    {saving ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                    ) : (
                      <><Search className="mr-2 h-4 w-4" /> Find My Crib</>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
