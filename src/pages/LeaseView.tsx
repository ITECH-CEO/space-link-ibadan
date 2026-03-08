import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface LeaseData {
  id: string;
  tenant_name: string;
  tenant_email: string | null;
  tenant_phone: string | null;
  start_date: string;
  end_date: string;
  rent_amount: number;
  payment_frequency: string;
  security_deposit: number;
  custom_terms: string[];
  additional_notes: string | null;
  status: string;
  acknowledged_at: string | null;
  access_token: string;
  property_id: string;
  room_type_id: string | null;
  created_at: string;
}

export default function LeaseView() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [lease, setLease] = useState<LeaseData | null>(null);
  const [property, setProperty] = useState<{ property_name: string; address: string; landlord_name: string } | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }

    const fetch = async () => {
      const { data, error } = await supabase
        .from("lease_agreements")
        .select("*")
        .eq("access_token", token)
        .maybeSingle();

      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setLease(data as LeaseData);

      const { data: prop } = await supabase
        .from("properties")
        .select("property_name, address, landlord_name")
        .eq("id", data.property_id)
        .single();
      setProperty(prop);

      if (data.room_type_id) {
        const { data: room } = await supabase
          .from("room_types")
          .select("name")
          .eq("id", data.room_type_id)
          .single();
        setRoomName(room?.name || null);
      }

      setLoading(false);
    };
    fetch();
  }, [token]);

  const handleAcknowledge = async () => {
    if (!lease || !token) return;
    setAcknowledging(true);

    const { error } = await supabase
      .from("lease_agreements")
      .update({ status: "acknowledged", acknowledged_at: new Date().toISOString() })
      .eq("access_token", token);

    if (error) {
      toast.error("Failed to acknowledge. Please try again.");
    } else {
      toast.success("Lease acknowledged successfully!");
      setLease({ ...lease, status: "acknowledged", acknowledged_at: new Date().toISOString() });
    }
    setAcknowledging(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container max-w-2xl py-12 text-center">
          <p className="text-muted-foreground">Loading lease agreement...</p>
        </main>
      </div>
    );
  }

  if (notFound || !lease) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container max-w-2xl py-12 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-warning mb-4" />
          <h1 className="text-2xl font-bold mb-2">Lease Not Found</h1>
          <p className="text-muted-foreground">This link may be invalid or expired.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-2xl py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Status banner */}
          {lease.status === "acknowledged" ? (
            <Card className="mb-6 border-success/30 bg-success/5">
              <CardContent className="pt-5 pb-4 flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-success" />
                <div>
                  <p className="font-semibold text-success">Lease Acknowledged</p>
                  <p className="text-sm text-muted-foreground">
                    Acknowledged on {new Date(lease.acknowledged_at!).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6 border-warning/30 bg-warning/5">
              <CardContent className="pt-5 pb-4 flex items-center gap-3">
                <FileText className="h-6 w-6 text-warning" />
                <div className="flex-1">
                  <p className="font-semibold text-warning">Pending Acknowledgment</p>
                  <p className="text-sm text-muted-foreground">Please review and acknowledge this lease agreement below.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lease Document */}
          <Card>
            <CardContent className="py-8 px-6 sm:px-10">
              <h1 className="text-center text-xl font-bold border-b-2 border-foreground pb-3 mb-2">
                TENANCY AGREEMENT
              </h1>
              <p className="text-center text-xs text-muted-foreground mb-8">Generated by MyCrib.ng</p>

              <h2 className="font-semibold mt-6 mb-2">Parties</h2>
              <p><strong>Landlord:</strong> {property?.landlord_name || "—"}</p>
              <p><strong>Tenant:</strong> {lease.tenant_name}
                {lease.tenant_email && ` (${lease.tenant_email})`}
                {lease.tenant_phone && ` — ${lease.tenant_phone}`}
              </p>

              <h2 className="font-semibold mt-6 mb-2">Property</h2>
              <p><strong>Property:</strong> {property?.property_name || "—"}</p>
              <p><strong>Address:</strong> {property?.address || "—"}</p>
              {roomName && <p><strong>Room:</strong> {roomName}</p>}

              <h2 className="font-semibold mt-6 mb-2">Lease Details</h2>
              <p><strong>Start Date:</strong> {new Date(lease.start_date).toLocaleDateString()}</p>
              <p><strong>End Date:</strong> {new Date(lease.end_date).toLocaleDateString()}</p>
              <p><strong>Rent:</strong> ₦{lease.rent_amount.toLocaleString()} ({lease.payment_frequency})</p>
              {lease.security_deposit > 0 && <p><strong>Security Deposit:</strong> ₦{lease.security_deposit.toLocaleString()}</p>}

              <h2 className="font-semibold mt-6 mb-2">Terms & Conditions</h2>
              <ol className="list-decimal pl-5 space-y-1 text-sm">
                {lease.custom_terms.map((t, i) => <li key={i}>{t}</li>)}
              </ol>

              {lease.additional_notes && (
                <>
                  <h2 className="font-semibold mt-6 mb-2">Additional Notes</h2>
                  <p className="text-sm">{lease.additional_notes}</p>
                </>
              )}

              {/* Acknowledge button */}
              {lease.status !== "acknowledged" && (
                <div className="mt-10 pt-6 border-t">
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    By clicking below, you acknowledge that you have read and agree to the terms of this tenancy agreement.
                  </p>
                  <Button
                    onClick={handleAcknowledge}
                    disabled={acknowledging}
                    className="w-full"
                    size="lg"
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    {acknowledging ? "Acknowledging..." : "I Acknowledge This Lease Agreement"}
                  </Button>
                </div>
              )}

              <p className="mt-8 text-center text-xs text-muted-foreground">
                Generated on {new Date(lease.created_at).toLocaleDateString()} via MyCrib.ng
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
