import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MessageSquareWarning, Loader2 } from "lucide-react";

interface ClientPlatformComplaintProps {
  userId: string;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
}

export function ClientPlatformComplaint({ userId, clientName, clientEmail, clientPhone }: ClientPlatformComplaintProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in the subject and description");
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from("platform_complaints").insert({
      user_id: userId,
      client_name: clientName,
      client_email: clientEmail || null,
      client_phone: clientPhone || null,
      category,
      subject: subject.trim(),
      description: description.trim(),
      priority,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Complaint submitted! Our team will review it shortly.");
      setOpen(false);
      setSubject("");
      setDescription("");
      setCategory("general");
      setPriority("medium");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">
          <MessageSquareWarning className="mr-2 h-4 w-4" />
          Contact Support
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit a Complaint or Inquiry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Inquiry</SelectItem>
                <SelectItem value="service">Service Complaint</SelectItem>
                <SelectItem value="billing">Billing Issue</SelectItem>
                <SelectItem value="matching">Matching Issue</SelectItem>
                <SelectItem value="account">Account Problem</SelectItem>
                <SelectItem value="suggestion">Suggestion</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Subject *</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your issue"
              maxLength={150}
            />
          </div>
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your issue or inquiry in detail..."
              maxLength={1000}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">{description.length}/1000</p>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmit} disabled={saving} className="w-full gradient-primary text-primary-foreground">
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
