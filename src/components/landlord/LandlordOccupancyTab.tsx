import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, DollarSign, TrendingUp } from "lucide-react";

interface PropertySummary {
  id: string;
  property_name: string;
  total_rooms: number | null;
  available_rooms: number | null;
  verification_status: string;
  match_count: number;
  accepted_count: number;
}

export function LandlordOccupancyTab() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: props } = await supabase
        .from("properties")
        .select("id, property_name, total_rooms, available_rooms, verification_status")
        .eq("owner_user_id", user.id);

      if (!props || props.length === 0) {
        setLoading(false);
        return;
      }

      const propIds = props.map((p) => p.id);
      const { data: matches } = await supabase
        .from("matches")
        .select("property_id, status")
        .in("property_id", propIds);

      const summaries = props.map((p) => {
        const propMatches = (matches || []).filter((m) => m.property_id === p.id);
        return {
          ...p,
          match_count: propMatches.length,
          accepted_count: propMatches.filter((m) => m.status === "accepted").length,
        };
      });

      setProperties(summaries);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const totalRooms = properties.reduce((sum, p) => sum + (p.total_rooms || 0), 0);
  const availableRooms = properties.reduce((sum, p) => sum + (p.available_rooms || 0), 0);
  const occupiedRooms = totalRooms - availableRooms;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const totalAccepted = properties.reduce((sum, p) => sum + p.accepted_count, 0);

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg gradient-primary p-2.5">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
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
              <div className="rounded-lg bg-success/10 p-2.5">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
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
              <div className="rounded-lg bg-warning/10 p-2.5">
                <Users className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Rooms</p>
                <p className="text-2xl font-bold">{availableRooms}/{totalRooms}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/10 p-2.5">
                <DollarSign className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Placed Tenants</p>
                <p className="text-2xl font-bold">{totalAccepted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Property List */}
      {properties.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No properties linked to your account yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Contact an admin to assign properties to you.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {properties.map((p) => {
            const occupied = (p.total_rooms || 0) - (p.available_rooms || 0);
            const rate = (p.total_rooms || 0) > 0 ? Math.round((occupied / (p.total_rooms || 1)) * 100) : 0;
            return (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{p.property_name}</CardTitle>
                    <Badge variant="outline" className={p.verification_status === "approved" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>
                      {p.verification_status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Occupancy</span>
                      <span className="font-medium">{occupied}/{p.total_rooms || 0} rooms ({rate}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${rate}%` }} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Matches</span>
                      <span>{p.match_count} total, {p.accepted_count} accepted</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
