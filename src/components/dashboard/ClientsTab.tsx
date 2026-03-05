import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VerificationBadge } from "@/components/VerificationBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Eye, FileText, User, Phone, Shield, CreditCard, Image } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export function ClientsTab() {
  const [clients, setClients] = useState<Tables<"clients">[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Tables<"clients"> | null>(null);

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    setClients(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const updateStatus = async (id: string, status: "pending" | "approved" | "rejected") => {
    const { error } = await supabase.from("clients").update({ verification_status: status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Status updated"); fetchClients(); }
  };

  const verificationChecks = (c: Tables<"clients">) => [
    { label: "Full Name", done: !!c.full_name, value: c.full_name },
    { label: "Phone", done: !!c.phone, value: c.phone },
    { label: "NIN", done: !!c.nin, value: c.nin },
    { label: "Government ID", done: !!c.government_id_url, value: c.government_id_url ? "Uploaded" : "Missing" },
    { label: "Proof of Admission", done: !!c.proof_of_admission_url, value: c.proof_of_admission_url ? "Uploaded" : "Missing" },
    { label: "Current Photo", done: !!c.current_photo_url, value: c.current_photo_url ? "Uploaded" : "Missing" },
    { label: "Guarantor Name", done: !!c.guarantor_name, value: c.guarantor_name },
    { label: "Guarantor Phone", done: !!c.guarantor_phone, value: c.guarantor_phone },
    { label: "Guarantor Relationship", done: !!c.guarantor_relationship, value: c.guarantor_relationship },
    { label: "Budget", done: !!(c.budget_min && c.budget_max), value: c.budget_min && c.budget_max ? `₦${Number(c.budget_min).toLocaleString()} – ₦${Number(c.budget_max).toLocaleString()}` : "Not set" },
  ];

  const completionPercent = (c: Tables<"clients">) => {
    const checks = verificationChecks(c);
    return Math.round((checks.filter((ch) => ch.done).length / checks.length) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Registrations</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : clients.length === 0 ? (
          <p className="text-muted-foreground">No clients registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.full_name}</TableCell>
                    <TableCell>{c.phone || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full gradient-primary"
                            style={{ width: `${completionPercent(c)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{completionPercent(c)}%</span>
                      </div>
                    </TableCell>
                    <TableCell><VerificationBadge status={c.verification_status} /></TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedClient(c)}>
                            <Eye className="mr-1 h-4 w-4" /> View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <User className="h-5 w-5" /> {c.full_name}
                              <VerificationBadge status={c.verification_status} />
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-2">
                            {/* Verification Checklist */}
                            <div>
                              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                <Shield className="h-4 w-4 text-primary" /> Verification Checklist
                              </h4>
                              <div className="grid grid-cols-2 gap-2">
                                {verificationChecks(c).map((ch) => (
                                  <div key={ch.label} className={`text-xs p-2 rounded border ${ch.done ? "border-success/20 bg-success/5" : "border-destructive/20 bg-destructive/5"}`}>
                                    <span className={ch.done ? "text-success" : "text-destructive"}>{ch.done ? "✓" : "✗"}</span>
                                    {" "}<span className="font-medium">{ch.label}:</span> {ch.value || "—"}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Documents */}
                            <div>
                              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" /> Documents
                              </h4>
                              <div className="grid grid-cols-3 gap-3">
                                {c.government_id_url && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Government ID</p>
                                    <a href={c.government_id_url} target="_blank" rel="noopener noreferrer">
                                      <img src={c.government_id_url} alt="Gov ID" className="h-24 w-full rounded-lg object-cover border hover:opacity-80 transition" />
                                    </a>
                                  </div>
                                )}
                                {c.proof_of_admission_url && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Proof of Admission</p>
                                    <a href={c.proof_of_admission_url} target="_blank" rel="noopener noreferrer">
                                      <img src={c.proof_of_admission_url} alt="Admission" className="h-24 w-full rounded-lg object-cover border hover:opacity-80 transition" />
                                    </a>
                                  </div>
                                )}
                                {c.current_photo_url && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Current Photo</p>
                                    <a href={c.current_photo_url} target="_blank" rel="noopener noreferrer">
                                      <img src={c.current_photo_url} alt="Photo" className="h-24 w-full rounded-lg object-cover border hover:opacity-80 transition" />
                                    </a>
                                  </div>
                                )}
                                {!c.government_id_url && !c.proof_of_admission_url && !c.current_photo_url && (
                                  <p className="text-xs text-muted-foreground col-span-3">No documents uploaded yet.</p>
                                )}
                              </div>
                            </div>

                            {/* Guarantor */}
                            <div>
                              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                <Phone className="h-4 w-4 text-primary" /> Guarantor Info
                              </h4>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div><span className="text-muted-foreground">Name:</span> {c.guarantor_name || "—"}</div>
                                <div><span className="text-muted-foreground">Phone:</span> {c.guarantor_phone || "—"}</div>
                                <div><span className="text-muted-foreground">Relationship:</span> {c.guarantor_relationship || "—"}</div>
                              </div>
                            </div>

                            {/* Preferences */}
                            {c.preferences && c.preferences.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm mb-2">Preferences</h4>
                                <div className="flex flex-wrap gap-1">
                                  {c.preferences.map((p) => (
                                    <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>
                      <Select onValueChange={(v) => updateStatus(c.id, v as any)} defaultValue={c.verification_status}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approve</SelectItem>
                          <SelectItem value="rejected">Reject</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
