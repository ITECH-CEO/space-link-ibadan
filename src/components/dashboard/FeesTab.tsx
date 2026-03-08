import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface PlatformFee {
  id: string;
  fee_type: string;
  amount: number;
  description: string | null;
  is_active: boolean;
}

export function FeesTab() {
  const [fees, setFees] = useState<PlatformFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editAmounts, setEditAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    const { data, error } = await (supabase as any)
      .from("platform_fees")
      .select("*")
      .order("fee_type");
    if (error) toast.error("Failed to load fees");
    else {
      setFees(data || []);
      const amounts: Record<string, string> = {};
      (data || []).forEach((f: PlatformFee) => {
        amounts[f.id] = f.amount.toString();
      });
      setEditAmounts(amounts);
    }
    setLoading(false);
  };

  const handleSave = async (fee: PlatformFee) => {
    const newAmount = parseFloat(editAmounts[fee.id]);
    if (isNaN(newAmount) || newAmount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setSaving(fee.id);
    const { error } = await (supabase as any)
      .from("platform_fees")
      .update({ amount: newAmount })
      .eq("id", fee.id);
    if (error) toast.error("Failed to update fee");
    else {
      toast.success(`${fee.fee_type.replace("_", " ")} fee updated to ₦${newAmount.toLocaleString()}`);
      fetchFees();
    }
    setSaving(null);
  };

  const handleToggle = async (fee: PlatformFee) => {
    const { error } = await (supabase as any)
      .from("platform_fees")
      .update({ is_active: !fee.is_active })
      .eq("id", fee.id);
    if (error) toast.error("Failed to toggle fee");
    else {
      toast.success(`${fee.fee_type.replace("_", " ")} fee ${!fee.is_active ? "enabled" : "disabled"}`);
      fetchFees();
    }
  };

  const feeLabels: Record<string, { title: string; icon: string }> = {
    inspection: { title: "Inspection Fee", icon: "🔍" },
    roommate_matching: { title: "Roommate Matching Fee", icon: "🤝" },
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading fees...</div>;

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Platform Fees</h2>
        <p className="text-sm text-muted-foreground">Configure fees that users pay for inspections and roommate matching</p>
      </div>
      {fees.map((fee) => {
        const label = feeLabels[fee.fee_type] || { title: fee.fee_type, icon: "💰" };
        return (
          <Card key={fee.id} className={!fee.is_active ? "opacity-60" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span>{label.icon}</span> {label.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{fee.description}</p>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Amount (₦)</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-2.5 text-sm font-bold text-muted-foreground">₦</span>
                    <Input
                      type="number"
                      value={editAmounts[fee.id] || ""}
                      onChange={(e) => setEditAmounts({ ...editAmounts, [fee.id]: e.target.value })}
                      className="pl-8"
                      min={0}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => handleSave(fee)}
                  disabled={saving === fee.id}
                  size="sm"
                >
                  {saving === fee.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  Save
                </Button>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={fee.is_active}
                    onCheckedChange={() => handleToggle(fee)}
                  />
                  <Label className="text-xs">{fee.is_active ? "Active" : "Off"}</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
