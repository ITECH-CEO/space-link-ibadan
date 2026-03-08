import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";

interface MatchedProperty {
  property_id: string;
  property_name: string;
}

interface ClientComplaintFormProps {
  matchedProperties: MatchedProperty[];
  clientName: string;
  clientPhone?: string | null;
}

export function ClientComplaintForm({ matchedProperties, clientName, clientPhone }: ClientComplaintFormProps) {
  const [open, setOpen] = useState(false);
  const [propertyId, setPropertyId] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!propertyId || !description.trim()) {
      toast.error("Select a property and describe the issue");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("maintenance_requests").insert({
      property_id: propertyId,
      tenant_name: clientName,
      tenant_phone: clientPhone || null,
      description: description.trim(),
      priority,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Complaint submitted successfully! The landlord will be notified.");
      setOpen(false);
      setPropertyId("");
      setDescription("");
      setPriority("medium");
    }
    setSaving(false);
  };

  if (matchedProperties.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-warning/30 text-warning hover:bg-warning/10">
          <AlertTriangle className="mr-2 h-4 w-4" />
          Report an Issue
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report a Maintenance Issue</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Property *</Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
              <SelectContent>
                {matchedProperties.map((p) => (
                  <SelectItem key={p.property_id} value={p.property_id}>{p.property_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button onClick={handleSubmit} disabled={saving} className="w-full gradient-primary text-primary-foreground">
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : "Submit Complaint"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
