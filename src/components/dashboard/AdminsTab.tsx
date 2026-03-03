import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface AdminRow {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  display_name?: string;
}

export function AdminsTab() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [profiles, setProfiles] = useState<{ user_id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("manager");
  const [adding, setAdding] = useState(false);

  const fetchAdmins = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false });

    const rows = (data || []).map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      role: r.role,
      created_at: r.created_at,
      display_name: r.profiles?.full_name || r.user_id.slice(0, 8),
    }));
    setAdmins(rows);
    setLoading(false);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("user_id, full_name");
    setProfiles(data || []);
  };

  useEffect(() => { fetchAdmins(); fetchProfiles(); }, []);

  const addAdmin = async () => {
    if (!selectedUserId) { toast.error("Select a user"); return; }
    setAdding(true);
    const { error } = await supabase.from("user_roles").insert({
      user_id: selectedUserId,
      role: selectedRole as any,
    });
    if (error) {
      if (error.message.includes("duplicate")) toast.error("User already has this role");
      else toast.error(error.message);
    } else {
      toast.success("Admin added!");
      setDialogOpen(false);
      setSelectedUserId("");
      fetchAdmins();
    }
    setAdding(false);
  };

  const removeAdmin = async (id: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Admin removed"); fetchAdmins(); }
  };

  const roleColors: Record<string, string> = {
    super_admin: "bg-primary/10 text-primary border-primary/20",
    manager: "bg-accent/10 text-accent-foreground border-accent/20",
    verifier: "bg-muted text-muted-foreground border-border",
    landlord: "bg-success/10 text-success border-success/20",
  };

  // Filter out users who already have roles
  const existingUserIds = new Set(admins.map((a) => a.user_id));
  const availableProfiles = profiles.filter((p) => !existingUserIds.has(p.user_id));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Admin Management</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Admin</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Select User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger><SelectValue placeholder="Choose a registered user" /></SelectTrigger>
                  <SelectContent>
                    {availableProfiles.length === 0 ? (
                      <SelectItem value="none" disabled>No available users</SelectItem>
                    ) : (
                      availableProfiles.map((p) => (
                        <SelectItem key={p.user_id} value={p.user_id}>
                          {p.full_name || p.user_id.slice(0, 8)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="verifier">Verifier</SelectItem>
                    <SelectItem value="landlord">Landlord</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addAdmin} disabled={adding} className="w-full gradient-primary text-primary-foreground">
                {adding ? "Adding..." : "Add Admin"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : admins.length === 0 ? (
          <p className="text-muted-foreground">No admins configured yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.display_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={roleColors[a.role] || ""}>
                        {a.role.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(a.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeAdmin(a.id)}>
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
  );
}
