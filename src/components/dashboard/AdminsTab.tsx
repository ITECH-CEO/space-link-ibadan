import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface AdminRow {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email?: string;
}

export function AdminsTab() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<string>("manager");
  const [adding, setAdding] = useState(false);

  const fetchAdmins = async () => {
    const { data } = await supabase.from("user_roles").select("*, profiles(full_name)").order("created_at", { ascending: false });
    // We can't get email directly, so show user_id
    const rows = (data || []).map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      role: r.role,
      created_at: r.created_at,
      email: r.profiles?.full_name || r.user_id.slice(0, 8),
    }));
    setAdmins(rows);
    setLoading(false);
  };

  useEffect(() => { fetchAdmins(); }, []);

  const removeAdmin = async (id: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Admin removed"); fetchAdmins(); }
  };

  const roleColors: Record<string, string> = {
    super_admin: "bg-primary/10 text-primary",
    manager: "bg-accent/10 text-accent-foreground",
    verifier: "bg-muted text-muted-foreground",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Management</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          To add a new admin, the user must first sign up. Then you can assign their role using their user ID from the profiles table.
        </p>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : admins.length === 0 ? (
          <p className="text-muted-foreground">No admins configured yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name / ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.email}</TableCell>
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
