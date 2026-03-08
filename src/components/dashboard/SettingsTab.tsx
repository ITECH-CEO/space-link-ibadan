import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, Banknote } from "lucide-react";

interface Setting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string | null;
}

export function SettingsTab() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    const { data } = await (supabase as any)
      .from("platform_settings")
      .select("*")
      .order("setting_key");
    if (data) {
      setSettings(data);
      const v: Record<string, string> = {};
      data.forEach((s: Setting) => { v[s.setting_key] = s.setting_value; });
      setValues(v);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const saveSettings = async () => {
    setSaving(true);
    const updates = settings.map((s) =>
      (supabase as any)
        .from("platform_settings")
        .update({ setting_value: values[s.setting_key] || "", updated_at: new Date().toISOString() })
        .eq("id", s.id)
    );
    const results = await Promise.all(updates);
    const hasError = results.some((r: any) => r.error);
    if (hasError) toast.error("Failed to save some settings");
    else toast.success("Payment settings updated!");
    setSaving(false);
  };

  const labelMap: Record<string, string> = {
    payment_account_name: "Account Name",
    payment_account_number: "Account Number",
    payment_bank_name: "Bank Name",
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" /> Payment Account Details
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            These details are displayed to clients when they need to make payments.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings
            .filter((s) => s.setting_key.startsWith("payment_"))
            .map((s) => (
              <div key={s.id} className="space-y-1.5">
                <Label>{labelMap[s.setting_key] || s.setting_key}</Label>
                <Input
                  value={values[s.setting_key] || ""}
                  onChange={(e) => setValues({ ...values, [s.setting_key]: e.target.value })}
                  placeholder={s.description || ""}
                />
                {s.description && (
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                )}
              </div>
            ))}

          <Button onClick={saveSettings} disabled={saving} className="gradient-primary text-primary-foreground">
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
