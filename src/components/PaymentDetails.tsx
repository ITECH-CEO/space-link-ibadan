import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Banknote, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface PaymentDetailsProps {
  amount?: number;
  label?: string;
}

export function PaymentDetails({ amount, label }: PaymentDetailsProps) {
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await (supabase as any)
        .from("platform_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["payment_account_name", "payment_account_number", "payment_bank_name"]);
      if (data) {
        data.forEach((s: any) => {
          if (s.setting_key === "payment_account_name") setAccountName(s.setting_value);
          if (s.setting_key === "payment_account_number") setAccountNumber(s.setting_value);
          if (s.setting_key === "payment_bank_name") setBankName(s.setting_value);
        });
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const copyAccount = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    toast.success("Account number copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return null;
  if (!accountNumber) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
            <Banknote className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-0.5">
              {label || "Payment Details"}
            </h4>
            {amount && (
              <p className="text-lg font-bold text-primary mb-2">
                ₦{amount.toLocaleString()}
              </p>
            )}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank</span>
                <span className="font-medium">{bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Name</span>
                <span className="font-medium">{accountName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Account Number</span>
                <span className="font-bold text-primary tracking-wide">{accountNumber}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyAccount}
              className="mt-3 w-full text-xs"
            >
              {copied ? (
                <><Check className="mr-1.5 h-3 w-3" /> Copied!</>
              ) : (
                <><Copy className="mr-1.5 h-3 w-3" /> Copy Account Number</>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
