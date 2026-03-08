import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DoorOpen, Banknote, Users, CheckCircle } from "lucide-react";

interface RoomInfo {
  id: string;
  name: string;
  price: number;
  description: string | null;
  features: string[];
  available_count: number;
  property_id: string;
  property_name: string;
  total_occupants: number;
}

interface LandlordRoomsTabProps {
  selectedPropertyId: string;
}

export function LandlordRoomsTab({ selectedPropertyId }: LandlordRoomsTabProps) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState(true);

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

      const [{ data: roomData }, { data: occupancies }] = await Promise.all([
        supabase.from("room_types").select("*").in("property_id", propIds),
        supabase.from("room_occupancies").select("room_type_id").in("property_id", propIds).eq("status", "occupied"),
      ]);

      const propMap = new Map(props.map(p => [p.id, p.property_name]));
      const occCounts = new Map<string, number>();
      (occupancies || []).forEach((o: any) => {
        if (o.room_type_id) {
          occCounts.set(o.room_type_id, (occCounts.get(o.room_type_id) || 0) + 1);
        }
      });

      const rows: RoomInfo[] = (roomData || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        price: r.price,
        description: r.description,
        features: r.features || [],
        available_count: r.available_count || 0,
        property_id: r.property_id,
        property_name: propMap.get(r.property_id) || "—",
        total_occupants: occCounts.get(r.id) || 0,
      }));
      setRooms(rows);
      setLoading(false);
    };
    fetchData();
  }, [user, selectedPropertyId]);

  const totalRooms = rooms.length;
  const totalAvailable = rooms.reduce((s, r) => s + r.available_count, 0);
  const totalOccupied = rooms.reduce((s, r) => s + r.total_occupants, 0);
  const avgPrice = rooms.length > 0 ? Math.round(rooms.reduce((s, r) => s + r.price, 0) / rooms.length) : 0;

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5"><DoorOpen className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Room Types</p>
                <p className="text-2xl font-bold">{totalRooms}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2.5"><CheckCircle className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Available Slots</p>
                <p className="text-2xl font-bold text-success">{totalAvailable}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2.5"><Users className="h-5 w-5 text-warning" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Occupied</p>
                <p className="text-2xl font-bold text-warning">{totalOccupied}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/10 p-2.5"><Banknote className="h-5 w-5 text-accent-foreground" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Price</p>
                <p className="text-2xl font-bold">₦{avgPrice.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Room Cards */}
      {rooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DoorOpen className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No room types configured yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Room types are managed by MyCrib.ng admins.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map(room => {
            const totalCapacity = room.available_count + room.total_occupants;
            const occupancyRate = totalCapacity > 0 ? Math.round((room.total_occupants / totalCapacity) * 100) : 0;

            return (
              <Card key={room.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{room.name}</CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      ₦{room.price.toLocaleString()}
                    </Badge>
                  </div>
                  {selectedPropertyId === "all" && (
                    <p className="text-xs text-muted-foreground">{room.property_name}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {room.description && (
                    <p className="text-sm text-muted-foreground">{room.description}</p>
                  )}
                  
                  {/* Occupancy bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Occupancy</span>
                      <span className="font-medium">{room.total_occupants}/{totalCapacity} ({occupancyRate}%)</span>
                    </div>
                    <Progress value={occupancyRate} className="h-2" />
                  </div>

                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs bg-success/10 text-success">
                      {room.available_count} available
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
                      {room.total_occupants} occupied
                    </Badge>
                  </div>

                  {/* Features */}
                  {room.features.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {room.features.map((f, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-normal">{f}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
