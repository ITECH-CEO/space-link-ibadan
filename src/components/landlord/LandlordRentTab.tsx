import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Banknote, Plus, CheckCircle, Clock, AlertTriangle, TrendingUp, Download } from "lucide-react";
import { toast } from "sonner";

interface RentPayment {
  id: string;
  property_id: string;
  room_type_id: string | null;
  tenant_name: string;
  tenant_phone: string | null;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

interface Property {
  id: string;
  property_name: string;
}

interface RoomType {
  id: string;
  name: string;
  property_id: string;
}

export function LandlordRentTab() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  // Form state
  const [form, setForm] = useState({
    property_id: "",
    room_type_id: "",
    tenant_name: "",
    tenant_phone: "",
    amount: "",
    due_date: "",
    payment_method: "",
    notes: "",
  });

  const fetchData = async () => {
    if (!user) return;

    const { data: props } = await supabase
      .from("properties")
      .select("id, property_name")
      .eq("owner_user_id", user.id);

    if (!props || props.length === 0) {
      setLoading(false);
      return;
    }

    setProperties(props);
    const propIds = props.map((p) => p.id);

    const [{ data: rents }, { data: rooms }] = await Promise.all([
      supabase
        .from("rent_payments")
        .select("*")
        .in("property_id", propIds)
        .order("due_date", { ascending: false }),
      supabase
        .from("room_types")
        .select("id, name, property_id")
        .in("property_id", propIds),
    ]);

    setPayments((rents as RentPayment[]) || []);
    setRoomTypes((rooms as RoomType[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleSubmit = async () => {
    if (!form.property_id || !form.tenant_name || !form.amount || !form.due_date) {
      toast.error("Please fill required fields");
      return;
    }

    const { error } = await supabase.from("rent_payments").insert({
      property_id: form.property_id,
      room_type_id: form.room_type_id || null,
      tenant_name: form.tenant_name,
      tenant_phone: form.tenant_phone || null,
      amount: parseFloat(form.amount),
      due_date: form.due_date,
      payment_method: form.payment_method || null,
      notes: form.notes || null,
    });

    if (error) {
      toast.error("Failed to record payment");
      return;
    }

    toast.success("Rent payment recorded");
    setDialogOpen(false);
    setForm({ property_id: "", room_type_id: "", tenant_name: "", tenant_phone: "", amount: "", due_date: "", payment_method: "", notes: "" });
    fetchData();
  };

  const markAsPaid = async (id: string) => {
    const { error } = await supabase
      .from("rent_payments")
      .update({ status: "paid", paid_date: new Date().toISOString().split("T")[0] })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update");
      return;
    }
    toast.success("Marked as paid");
    fetchData();
  };

  const totalReceived = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const totalOverdue = payments.filter((p) => p.status === "overdue").reduce((s, p) => s + p.amount, 0);

  const filtered = filter === "all" ? payments : payments.filter((p) => p.status === filter);

  const getPropertyName = (id: string) => properties.find((p) => p.id === id)?.property_name || "—";
  const getRoomName = (id: string | null) => (id ? roomTypes.find((r) => r.id === id)?.name || "—" : "—");

  const filteredRooms = roomTypes.filter((r) => r.property_id === form.property_id);

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2.5"><CheckCircle className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Received</p>
                <p className="text-2xl font-bold text-success">₦{totalReceived.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2.5"><Clock className="h-5 w-5 text-warning" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning">₦{totalPending.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2.5"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">₦{totalOverdue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {["all", "pending", "paid", "overdue"].map((s) => (
            <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)} className="capitalize">
              {s}
            </Button>
          ))}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" />Record Payment</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Record Rent Payment</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Property *</Label>
                <Select value={form.property_id} onValueChange={(v) => setForm({ ...form, property_id: v, room_type_id: "" })}>
                  <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {filteredRooms.length > 0 && (
                <div>
                  <Label>Room Type</Label>
                  <Select value={form.room_type_id} onValueChange={(v) => setForm({ ...form, room_type_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select room (optional)" /></SelectTrigger>
                    <SelectContent>
                      {filteredRooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Tenant Name *</Label>
                <Input value={form.tenant_name} onChange={(e) => setForm({ ...form, tenant_name: e.target.value })} />
              </div>
              <div>
                <Label>Tenant Phone</Label>
                <Input value={form.tenant_phone} onChange={(e) => setForm({ ...form, tenant_phone: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Amount (₦) *</Label>
                  <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <Label>Due Date *</Label>
                  <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="pos">POS</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
              <Button onClick={handleSubmit} className="w-full">Save Payment Record</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No rent payment records{filter !== "all" ? ` with status "${filter}"` : ""} yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Rent Payment History</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{p.tenant_name}</p>
                          {p.tenant_phone && <p className="text-xs text-muted-foreground">{p.tenant_phone}</p>}
                        </div>
                      </TableCell>
                      <TableCell>{getPropertyName(p.property_id)}</TableCell>
                      <TableCell>{getRoomName(p.room_type_id)}</TableCell>
                      <TableCell className="font-semibold">₦{p.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            p.status === "paid"
                              ? "bg-success/10 text-success"
                              : p.status === "overdue"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-warning/10 text-warning"
                          }
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {p.status !== "paid" && (
                          <Button size="sm" variant="outline" onClick={() => markAsPaid(p.id)}>
                            <CheckCircle className="mr-1 h-3.5 w-3.5" /> Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
