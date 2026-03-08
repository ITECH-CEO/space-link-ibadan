import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";

interface OccupiedRoom {
  property_id: string;
  property_name: string;
  room_type_id: string | null;
  room_type_name: string | null;
}

interface ClientComplaintFormProps {
  matchedProperties: { property_id: string; property_name: string }[];
  clientName: string;
  clientPhone?: string | null;
  userId: string;
}

export function ClientComplaintForm({ matchedProperties, clientName, clientPhone, userId }: ClientComplaintFormProps) {
  const [open, setOpen] = useState(false);
  const [occupiedRooms, setOccupiedRooms] = useState<OccupiedRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [saving, setSaving] = useState(false);

  // Fetch occupied rooms for this tenant
  useEffect(() => {
    if (!open || !userId) return;
    const fetchOccupied = async () => {
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (!client) return;

      const { data: occupancies } = await (supabase as any)
        .from("room_occupancies")
        .select("property_id, room_type_id, properties(property_name), room_types(name)")
        .eq("client_id", client.id)
        .eq("status", "occupied");

      if (occupancies) {
        setOccupiedRooms(occupancies.map((o: any) => ({
          property_id: o.property_id,
          property_name: o.properties?.property_name || "Unknown",
          room_type_id: o.room_type_id,
          room_type_name: o.room_types?.name || null,
        })));
      }
    };
    fetchOccupied();
  }, [open, userId]);

  const handleSubmit = async () => {
    if (!selectedRoom || !description.trim()) {
      toast.error("Select a room and describe the issue");
      return;
    }
    const room = occupiedRooms.find((_, i) => i.toString() === selectedRoom);
    if (!room) return;

    setSaving(true);
    const { error } = await supabase.from("maintenance_requests").insert({
      property_id: room.property_id,
      room_type_id: room.room_type_id || null,
      tenant_name: clientName,
      tenant_phone: clientPhone || null,
      description: description.trim(),
      priority,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Maintenance complaint submitted! The landlord will be notified.");
      setOpen(false);
      setSelectedRoom("");
      setDescription("");
      setPriority("medium");
    }
    setSaving(false);
  };

  // Only show for tenants with occupied rooms
  if (matchedProperties.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-warning/30 text-warning hover:bg-warning/10">
          <AlertTriangle className="mr-2 h-4 w-4" />
          Report Maintenance Issue
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report a Maintenance Issue</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Your Room *</Label>
            {occupiedRooms.length > 0 ? (
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger><SelectValue placeholder="Select your room" /></SelectTrigger>
                <SelectContent>
                  {occupiedRooms.map((r, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {r.property_name}{r.room_type_name ? ` — ${r.room_type_name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                No occupied rooms found. Only tenants with active rooms can report maintenance issues.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Describe the issue *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Leaking roof in the bedroom, broken door lock..."
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">{description.length}/500</p>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low — Minor inconvenience</SelectItem>
                <SelectItem value="medium">Medium — Needs attention soon</SelectItem>
                <SelectItem value="high">High — Affecting daily life</SelectItem>
                <SelectItem value="urgent">Urgent — Safety/health risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={saving || occupiedRooms.length === 0}
            className="w-full gradient-primary text-primary-foreground"
          >
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : "Submit Complaint"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
