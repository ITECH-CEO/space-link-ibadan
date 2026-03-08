import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Users, Banknote, TrendingUp, AlertTriangle } from "lucide-react";

interface OccupancyRecord {
  id: string;
  tenant_name: string;
  tenant_phone: string | null;
  status: string;
  rent_status: string;
  move_in_date: string;
  move_out_date: string | null;
  property_name: string;
  room_name: string | null;
}

interface PropertySummary {
  id: string;
  property_name: string;
  total_rooms: number | null;
  available_rooms: number | null;
  verification_status: string;
}

export function LandlordOccupancyTab() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [occupancies, setOccupancies] = useState<OccupancyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: props } = await supabase
        .from("properties")
        .select("id, property_name, total_rooms, available_rooms, verification_status")
        .eq("owner_user_id", user.id);

      if (!props || props.length === 0) { setLoading(false); return; }
      setProperties(props);

      const propIds = props.map(p => p.id);
      const { data: occs } = await supabase
        .from("room_occupancies")
        .select("*, properties(property_name), room_types(name)")
        .in("property_id", propIds)
        .order("created_at", { ascending: false });

      const rows: OccupancyRecord[] = (occs || []).map((r: any) => ({
        id: r.id,
        tenant_name: r.tenant_name,
        tenant_phone: r.tenant_phone,
        status: r.status,
        rent_status: r.rent_status,
        move_in_date: r.move_in_date,
        move_out_date: r.move_out_date,
        property_name: r.properties?.property_name || "—",
        room_name: r.room_types?.name || null,
      }));
      setOccupancies(rows);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const totalRooms = properties.reduce((sum, p) => sum + (p.total_rooms || 0), 0);
  const availableRooms = properties.reduce((sum, p) => sum + (p.available_rooms || 0), 0);
  const occupiedCount = occupancies.filter(o => o.status === "occupied").length;
  const atRiskCount = occupancies.filter(o => o.status === "at_risk").length;
  const occupancyRate = totalRooms > 0 ? Math.round(((totalRooms - availableRooms) / totalRooms) * 100) : 0;

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg gradient-primary p-2.5"><Building2 className="h-5 w-5 text-primary-foreground" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Properties</p>
                <p className="text-2xl font-bold">{properties.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2.5"><TrendingUp className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                <p className="text-2xl font-bold">{occupancyRate}%</p>
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
                <p className="text-2xl font-bold text-warning">{atRiskCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/10 p-2.5"><Users className="h-5 w-5 text-accent-foreground" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Rooms Available</p>
                <p className="text-2xl font-bold">{availableRooms}/{totalRooms}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {occupancies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No occupancy records yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Records are created automatically when client matches are accepted.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">Tenant Occupancies</CardTitle></CardHeader>
          <CardContent>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {occupancies.map(o => (
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
