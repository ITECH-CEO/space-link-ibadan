import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VerificationBadge } from "@/components/VerificationBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PropertyForm } from "@/components/forms/PropertyForm";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export function PropertiesTab() {
  const [properties, setProperties] = useState<Tables<"properties">[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === properties.length) setSelected(new Set());
    else setSelected(new Set(properties.map(p => p.id)));
  };

  const bulkUpdateStatus = async (status: "approved" | "rejected") => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const { error } = await supabase
      .from("properties")
      .update({ verification_status: status })
      .in("id", ids);
    if (error) toast.error(error.message);
    else {
      toast.success(`${ids.length} properties ${status}`);
      setSelected(new Set());
      fetchProperties();
    }
  };

  const fetchProperties = async () => {
    const { data } = await supabase.from("properties").select("*").order("created_at", { ascending: false });
    setProperties(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProperties(); }, []);

  const updateStatus = async (id: string, status: "pending" | "approved" | "rejected") => {
    const { error } = await supabase.from("properties").update({ verification_status: status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Status updated"); fetchProperties(); }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Properties</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader><DialogTitle>Add New Property</DialogTitle></DialogHeader>
            <PropertyForm onSuccess={() => { setDialogOpen(false); fetchProperties(); }} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : properties.length === 0 ? (
          <p className="text-muted-foreground">No properties listed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Landlord</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rooms</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.property_name}</TableCell>
                    <TableCell>{p.landlord_name}</TableCell>
                    <TableCell className="capitalize">{p.property_type}</TableCell>
                    <TableCell>{p.available_rooms}/{p.total_rooms}</TableCell>
                    <TableCell>{p.address}</TableCell>
                    <TableCell><VerificationBadge status={p.verification_status} /></TableCell>
                    <TableCell>
                      <Select onValueChange={(v) => updateStatus(p.id, v as any)} defaultValue={p.verification_status}>
                        <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
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
