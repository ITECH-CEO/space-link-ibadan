import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CalendarDays, Plus, Trash2, Clock, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface Slot {
  id: string;
  property_id: string;
  slot_date: string;
  slot_time: string;
  max_bookings: number;
  current_bookings: number;
  property_name?: string;
}

interface Booking {
  id: string;
  slot_id: string;
  property_id: string;
  client_id: string;
  user_id: string;
  status: string;
  created_at: string;
  client_name?: string;
  property_name?: string;
  slot_date?: string;
  slot_time?: string;
}

export function InspectionsTab() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<{ id: string; property_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // New slot form
  const [newSlot, setNewSlot] = useState({ property_id: "", slot_date: "", slot_time: "", max_bookings: "3" });

  const fetchData = async () => {
    const [{ data: slotsData }, { data: bookingsData }, { data: propsData }] = await Promise.all([
      (supabase as any).from("inspection_slots").select("*, properties(property_name)").order("slot_date", { ascending: true }),
      (supabase as any).from("inspection_bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("properties").select("id, property_name").order("property_name"),
    ]);

    const formattedSlots = (slotsData || []).map((s: any) => ({
      ...s,
      property_name: s.properties?.property_name,
    }));
    setSlots(formattedSlots);
    setProperties(propsData || []);

    // Enrich bookings
    if (bookingsData && bookingsData.length > 0) {
      const clientIds = [...new Set(bookingsData.map((b: any) => b.client_id))] as string[];
      const { data: clients } = await supabase.from("clients").select("id, full_name").in("id", clientIds);
      const clientMap = new Map((clients || []).map((c) => [c.id, c.full_name]));
      const slotMap = new Map(formattedSlots.map((s: Slot) => [s.id, s]));

      setBookings(bookingsData.map((b: any) => {
        const slot = slotMap.get(b.slot_id);
        return {
          ...b,
          client_name: clientMap.get(b.client_id) || "Unknown",
          property_name: slot?.property_name || "—",
          slot_date: slot?.slot_date,
          slot_time: slot?.slot_time,
        };
      }));
    } else {
      setBookings([]);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const createSlot = async () => {
    if (!newSlot.property_id || !newSlot.slot_date || !newSlot.slot_time) {
      toast.error("Fill all fields");
      return;
    }
    const { error } = await (supabase as any).from("inspection_slots").insert({
      property_id: newSlot.property_id,
      slot_date: newSlot.slot_date,
      slot_time: newSlot.slot_time,
      max_bookings: parseInt(newSlot.max_bookings) || 3,
      created_by: user?.id,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Slot created!");
      setDialogOpen(false);
      setNewSlot({ property_id: "", slot_date: "", slot_time: "", max_bookings: "3" });
      fetchData();
    }
  };

  const deleteSlot = async (id: string) => {
    const { error } = await (supabase as any).from("inspection_slots").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Slot removed"); fetchData(); }
  };

  return (
    <div className="space-y-6">
      {/* Slots Management */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" /> Inspection Slots
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> Add Slot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Inspection Slot</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Property</Label>
                  <Select value={newSlot.property_id} onValueChange={(v) => setNewSlot({ ...newSlot, property_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                    <SelectContent>
                      {properties.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={newSlot.slot_date} onChange={(e) => setNewSlot({ ...newSlot, slot_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input type="time" value={newSlot.slot_time} onChange={(e) => setNewSlot({ ...newSlot, slot_time: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Max Bookings per Slot</Label>
                  <Input type="number" value={newSlot.max_bookings} onChange={(e) => setNewSlot({ ...newSlot, max_bookings: e.target.value })} min="1" max="20" />
                </div>
                <Button onClick={createSlot} className="w-full gradient-primary text-primary-foreground">Create Slot</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : slots.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No inspection slots yet. Create some for clients to book.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slots.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.property_name || "—"}</TableCell>
                      <TableCell>{s.slot_date}</TableCell>
                      <TableCell>{s.slot_time?.slice(0, 5)}</TableCell>
                      <TableCell>
                        <Badge variant={s.current_bookings >= s.max_bookings ? "destructive" : "secondary"}>
                          {s.current_bookings}/{s.max_bookings}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteSlot(s.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Inspection Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Booked On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.client_name}</TableCell>
                      <TableCell>{b.property_name}</TableCell>
                      <TableCell>{b.slot_date || "—"}</TableCell>
                      <TableCell>{b.slot_time?.slice(0, 5) || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20 capitalize">
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(b.created_at), "PP")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
