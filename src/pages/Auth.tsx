import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle, ArrowLeft } from "lucide-react";
import mycribLogo from "@/assets/mycrib-logo.png";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isSignUp = searchParams.get("mode") === "signup";
  const [mode, setMode] = useState<"signin" | "signup">(isSignUp ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const { signIn, signUp, user, userRole } = useAuth();

  useEffect(() => {
    if (!user) return;
    setCheckingProfile(true);
    (supabase as any)
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data || userRole) {
          navigate("/profile", { replace: true });
        } else {
          navigate("/onboarding", { replace: true });
        }
        setCheckingProfile(false);
      });
  }, [user, userRole]);

  if (checkingProfile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast.error(error.message);
      } else {
        setSignUpSuccess(true);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes("Email not confirmed")) {
          toast.error("Please verify your email before signing in. Check your inbox for a confirmation link.");
        } else {
          toast.error(error.message);
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center gradient-hero px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 40%, hsl(217 91% 60% / 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 60%, hsl(25 95% 53% / 0.15) 0%, transparent 50%)" }} />
      
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <AnimatePresence mode="wait">
          {signUpSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="card-elevated border-border/50 shadow-2xl backdrop-blur-sm">
                <CardContent className="pt-8 pb-8 text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="inline-flex items-center justify-center rounded-full bg-success/10 p-4"
                  >
                    <Mail className="h-10 w-10 text-success" />
                  </motion.div>
                  <h2 className="font-display text-2xl font-bold">Check Your Email</h2>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    We've sent a verification link to <span className="font-semibold text-foreground">{email}</span>. 
                    Click the link in the email to activate your account.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
                    <p className="text-sm font-medium">What's next?</p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Open your email inbox</li>
                      <li>Click the verification link from MyCrib.ng</li>
                      <li>Come back here and sign in</li>
                      <li>Complete your profile to get matched</li>
                    </ol>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Didn't receive it? Check your spam folder or try signing up again.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSignUpSuccess(false);
                      setMode("signin");
                    }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="card-elevated border-border/50 shadow-2xl backdrop-blur-sm">
                <CardHeader className="text-center">
                  <motion.img
                    src={mycribLogo}
                    alt="MyCrib.ng"
                    className="mx-auto mb-4 h-16 w-16 rounded-xl object-contain"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  />
                  <CardTitle className="font-display text-2xl">
                    {mode === "signin" ? "Welcome Back" : "Create Account"}
                  </CardTitle>
                  <CardDescription>
                    {mode === "signin"
                      ? "Sign in to your MyCrib.ng account"
                      : "Join MyCrib.ng to find your perfect accommodation"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === "signup" && (
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required maxLength={100} />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required maxLength={255} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        {mode === "signin" && (
                          <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                        )}
                      </div>
                      <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                    </div>
                    <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
                      {loading ? "Loading..." : mode === "signin" ? "Sign In" : "Create Account"}
                    </Button>
                  </form>

                  {mode === "signup" && (
                    <p className="mt-3 text-xs text-muted-foreground text-center">
                      By signing up, you agree to our terms and conditions. You'll need to verify your email before signing in.
                    </p>
                  )}

                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    {mode === "signin" ? (
                      <>Don't have an account?{" "}<button onClick={() => setMode("signup")} className="text-primary underline">Sign Up</button></>
                    ) : (
                      <>Already have an account?{" "}<button onClick={() => setMode("signin")} className="text-primary underline">Sign In</button></>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
