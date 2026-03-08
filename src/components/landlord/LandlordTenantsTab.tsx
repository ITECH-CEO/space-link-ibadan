import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search, Phone, Calendar, AlertTriangle } from "lucide-react";

interface Tenant {
  id: string;
  tenant_name: string;
  tenant_phone: string | null;
  status: string;
  rent_status: string;
  move_in_date: string;
  move_out_date: string | null;
  property_name: string;
  property_id: string;
  room_name: string | null;
  notes: string | null;
}

interface LandlordTenantsTabProps {
  selectedPropertyId: string;
}

export function LandlordTenantsTab({ selectedPropertyId }: LandlordTenantsTabProps) {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: props } = await supabase
        .from("properties")
        .select("id, property_name")
        .eq("owner_user_id", user.id);

      if (!props || props.length === 0) { setLoading(false); return; }

      const propIds = selectedPropertyId === "all" 
        ? props.map(p => p.id) 
        : props.filter(p => p.id === selectedPropertyId).map(p => p.id);

      if (propIds.length === 0) { setLoading(false); return; }

      const { data: occs } = await supabase
        .from("room_occupancies")
        .select("*, properties(property_name), room_types(name)")
        .in("property_id", propIds)
        .order("created_at", { ascending: false });

      const rows: Tenant[] = (occs || []).map((r: any) => ({
        id: r.id,
        tenant_name: r.tenant_name,
        tenant_phone: r.tenant_phone,
        status: r.status,
        rent_status: r.rent_status,
        move_in_date: r.move_in_date,
        move_out_date: r.move_out_date,
        property_name: r.properties?.property_name || "—",
        property_id: r.property_id,
        room_name: r.room_types?.name || null,
        notes: r.notes,
      }));
      setTenants(rows);
      setLoading(false);
    };
    fetchData();
  }, [user, selectedPropertyId]);

  const filtered = tenants.filter(t => 
    t.tenant_name.toLowerCase().includes(search.toLowerCase()) ||
    t.property_name.toLowerCase().includes(search.toLowerCase()) ||
    (t.tenant_phone || "").includes(search)
  );

  const activeCount = tenants.filter(t => t.status === "occupied").length;
  const atRiskCount = tenants.filter(t => t.status === "at_risk").length;
  const vacatedCount = tenants.filter(t => t.status === "vacated").length;

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2.5"><Users className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Active Tenants</p>
                <p className="text-2xl font-bold text-success">{activeCount}</p>
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
              <div className="rounded-lg bg-muted p-2.5"><Users className="h-5 w-5 text-muted-foreground" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Vacated</p>
                <p className="text-2xl font-bold">{vacatedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search tenants..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="pl-9" 
        />
      </div>

      {/* Tenant List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No tenants found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">Tenant Directory</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rent Status</TableHead>
                    <TableHead>Move In</TableHead>
                    <TableHead>Move Out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{t.tenant_name}</p>
                          {t.tenant_phone && (
                            <a href={`tel:${t.tenant_phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                              <Phone className="h-3 w-3" /> {t.tenant_phone}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{t.property_name}</TableCell>
                      <TableCell className="text-sm">{t.room_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          t.status === "occupied" ? "bg-success/10 text-success" :
                          t.status === "at_risk" ? "bg-warning/10 text-warning" :
                          "bg-muted text-muted-foreground"
                        }>{t.status.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          t.rent_status === "current" ? "bg-success/10 text-success" :
                          t.rent_status === "overdue" ? "bg-destructive/10 text-destructive" :
                          "bg-primary/10 text-primary"
                        }>{t.rent_status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {new Date(t.move_in_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {t.move_out_date ? new Date(t.move_out_date).toLocaleDateString() : "—"}
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
