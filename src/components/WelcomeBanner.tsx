import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, CheckCircle2, Clock } from "lucide-react";

interface WelcomeBannerProps {
  isTenant: boolean;
  clientName: string;
}

export function WelcomeBanner({ isTenant, clientName }: WelcomeBannerProps) {
  const { user } = useAuth();
  const [profileProgress, setProfileProgress] = useState(0);
  const [greeting, setGreeting] = useState("Welcome back");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("clients")
        .select("full_name, phone, nin, gender, government_id_url, proof_of_admission_url, current_photo_url, guarantor_name, guarantor_phone, course, faculty, budget_min, budget_max")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!data) { setProfileProgress(0); return; }
      const fields = [
        data.full_name, data.gender, data.phone, data.nin,
        data.government_id_url, data.proof_of_admission_url,
        data.current_photo_url, data.guarantor_name, data.guarantor_phone,
        data.course && data.faculty, data.budget_min && data.budget_max,
      ];
      const done = fields.filter(Boolean).length;
      setProfileProgress(Math.round((done / fields.length) * 100));
    })();
  }, [user]);

  const firstName = clientName?.split(" ")[0] || "there";

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="overflow-hidden border-primary/20 card-elevated mb-6">
        <div className="h-1.5 w-full gradient-primary" />
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-bold">
                  {greeting}, {firstName}! 👋
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {isTenant
                  ? "You're all set! Manage your accommodation, track payments, and report issues from here."
                  : profileProgress >= 100
                    ? "Your profile is complete. We're working on finding the best matches for you!"
                    : "Complete your profile to get matched with the perfect accommodation."}
              </p>

              {/* Profile completion for non-tenants */}
              {!isTenant && profileProgress < 100 && (
                <div className="mt-3 max-w-sm">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Profile completion</span>
                    <span className="font-semibold text-primary">{profileProgress}%</span>
                  </div>
                  <Progress value={profileProgress} className="h-2" />
                  <Link to="/profile">
                    <Button variant="link" size="sm" className="px-0 mt-1 text-xs h-auto">
                      Complete your profile <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              )}

              {/* Tenant status badges */}
              {isTenant && (
                <div className="flex items-center gap-2 mt-3">
                  <Badge className="bg-success/10 text-success border-success/20" variant="outline">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Active Tenant
                  </Badge>
                </div>
              )}

              {/* Waiting for match */}
              {!isTenant && profileProgress >= 100 && (
                <div className="flex items-center gap-2 mt-3">
                  <Badge className="bg-warning/10 text-warning border-warning/20" variant="outline">
                    <Clock className="mr-1 h-3 w-3" /> Awaiting Match
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
