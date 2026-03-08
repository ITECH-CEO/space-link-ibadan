import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Gift, Copy, Users } from "lucide-react";

export function ReferralCard() {
  const { user } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [uses, setUses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from("referral_codes")
      .select("code, uses")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setCode(data.code);
          setUses(data.uses);
        }
        setLoading(false);
      });
  }, [user]);

  const generateCode = async () => {
    if (!user) return;
    const newCode = `MYCRIB-${user.id.slice(0, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const { error } = await (supabase as any).from("referral_codes").insert({
      user_id: user.id,
      code: newCode,
    });
    if (error) {
      toast.error(error.message);
    } else {
      setCode(newCode);
      toast.success("Referral code generated!");
    }
  };

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast.success("Copied to clipboard!");
  };

  if (loading) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gift className="h-5 w-5 text-primary" /> Referral Program
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {code ? (
          <>
            <p className="text-sm text-muted-foreground">Share your code with friends to earn rewards!</p>
            <div className="flex gap-2">
              <Input value={code} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={copyCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" /> {uses} {uses === 1 ? "person" : "people"} referred
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Get a referral code to share with friends and earn rewards.</p>
            <Button onClick={generateCode} className="w-full gradient-primary text-primary-foreground">
              <Gift className="mr-2 h-4 w-4" /> Generate My Code
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
