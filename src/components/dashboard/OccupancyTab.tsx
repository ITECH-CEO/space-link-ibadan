import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Building2, Users, AlertTriangle, TrendingUp, Search, Download, Edit2 } from "lucide-react";
import { toast } from "sonner";

interface Occupancy {
  id: string;
  property_id: string;
  room_type_id: string | null;
  client_id: string | null;
  tenant_name: string;
  tenant_phone: string | null;
  status: string;
  move_in_date: string;
  move_out_date: string | null;
  rent_status: string;
  notes: string | null;
  created_at: string;
  property_name: string;
  room_name: string | null;
}

export function OccupancyTab() {
  const [occupancies, setOccupancies] = useState<Occupancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editRentStatus, setEditRentStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editMoveOut, setEditMoveOut] = useState("");

  const fetchOccupancies = async () => {
    const { data } = await supabase
      .from("room_occupancies")
      .select("*, properties(property_name), room_types(name)")
      .order("created_at", { ascending: false });

    const rows: Occupancy[] = (data || []).map((r: any) => ({
      id: r.id,
      property_id: r.property_id,
      room_type_id: r.room_type_id,
      client_id: r.client_id,
      tenant_name: r.tenant_name,
      tenant_phone: r.tenant_phone,
      status: r.status,
      move_in_date: r.move_in_date,
      move_out_date: r.move_out_date,
      rent_status: r.rent_status,
      notes: r.notes,
      created_at: r.created_at,
      property_name: r.properties?.property_name || "—",
      room_name: r.room_types?.name || null,
    }));
    setOccupancies(rows);
    setLoading(false);
  };

  useEffect(() => { fetchOccupancies(); }, []);

  const handleUpdate = async (id: string) => {
    const updates: any = { status: editStatus, rent_status: editRentStatus, notes: editNotes || null };
    if (editMoveOut) updates.move_out_date = editMoveOut;
    if (editStatus === "vacant" && !editMoveOut) updates.move_out_date = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("room_occupancies").update(updates).eq("id", id);
    if (error) { toast.error(error.message); return; }

    // If marking vacant, increment available rooms
    if (editStatus === "vacant") {
      const occ = occupancies.find(o => o.id === id);
      if (occ) {
        const { data: propData } = await supabase.from("properties").select("available_rooms").eq("id", occ.property_id).single();
        if (propData) {
          await supabase.from("properties").update({ available_rooms: (propData.available_rooms || 0) + 1 }).eq("id", occ.property_id);
        }
      }
    }

    toast.success("Occupancy updated");
    setEditingId(null);
    fetchOccupancies();
  };

  const openEdit = (o: Occupancy) => {
    setEditingId(o.id);
    setEditStatus(o.status);
    setEditRentStatus(o.rent_status);
    setEditNotes(o.notes || "");
    setEditMoveOut(o.move_out_date || "");
  };

  const filtered = occupancies.filter(o => {
    const matchSearch = o.tenant_name.toLowerCase().includes(search.toLowerCase()) ||
      o.property_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const total = occupancies.length;
  const occupied = occupancies.filter(o => o.status === "occupied").length;
  const atRisk = occupancies.filter(o => o.status === "at_risk").length;
  const vacant = occupancies.filter(o => o.status === "vacant").length;

  const exportCSV = () => {
    const headers = "Tenant,Property,Room,Status,Rent Status,Move In,Move Out,Notes\n";
    const rows = filtered.map(o =>
      `"${o.tenant_name}","${o.property_name}","${o.room_name || "—"}","${o.status}","${o.rent_status}","${o.move_in_date}","${o.move_out_date || ""}","${o.notes || ""}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "occupancies.csv"; a.click();
  };

  if (loading) return <p className="text-muted-foreground">Loading occupancy data...</p>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg gradient-primary p-2.5"><Users className="h-5 w-5 text-primary-foreground" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2.5"><TrendingUp className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Occupied</p>
                <p className="text-2xl font-bold text-success">{occupied}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2.5"><AlertTriangle className="h-5 w-5 text-warning" /></div>
              <div>
                <p className="text-sm text-muted-foreground">At Risk</p>
                <p className="text-2xl font-bold text-warning">{atRisk}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2.5"><Building2 className="h-5 w-5 text-muted-foreground" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Vacant</p>
                <p className="text-2xl font-bold">{vacant}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tenant or property..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="occupied">Occupied</SelectItem>
            <SelectItem value="at_risk">At Risk</SelectItem>
            <SelectItem value="vacant">Vacant</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Export</Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Move In</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No occupancy records found</TableCell></TableRow>
                ) : filtered.map(o => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{o.tenant_name}</p>
                        {o.tenant_phone && <p className="text-xs text-muted-foreground">{o.tenant_phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{o.property_name}</TableCell>
                    <TableCell className="text-sm">{o.room_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        o.status === "occupied" ? "bg-success/10 text-success" :
                        o.status === "at_risk" ? "bg-warning/10 text-warning" :
                        "bg-muted text-muted-foreground"
                      }>{o.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        o.rent_status === "current" ? "bg-success/10 text-success" :
                        o.rent_status === "overdue" ? "bg-destructive/10 text-destructive" :
                        "bg-primary/10 text-primary"
                      }>{o.rent_status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(o.move_in_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Dialog open={editingId === o.id} onOpenChange={open => !open && setEditingId(null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(o)}><Edit2 className="h-4 w-4" /></Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Update Occupancy</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Occupancy Status</Label>
                              <Select value={editStatus} onValueChange={setEditStatus}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="occupied">Occupied</SelectItem>
                                  <SelectItem value="at_risk">At Risk</SelectItem>
                                  <SelectItem value="vacant">Vacant</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Rent Status</Label>
                              <Select value={editRentStatus} onValueChange={setEditRentStatus}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="current">Current</SelectItem>
                                  <SelectItem value="overdue">Overdue</SelectItem>
                                  <SelectItem value="paid_ahead">Paid Ahead</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Move Out Date</Label>
                              <Input type="date" value={editMoveOut} onChange={e => setEditMoveOut(e.target.value)} />
                            </div>
                            <div>
                              <Label>Notes</Label>
                              <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} />
                            </div>
                            <Button onClick={() => handleUpdate(o.id)} className="w-full">Save Changes</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
