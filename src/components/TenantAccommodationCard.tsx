import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, DoorOpen, CalendarDays, Banknote, MapPin, Home, Users } from "lucide-react";
import { motion } from "framer-motion";

interface TenantRoom {
  id: string;
  property_id: string;
  property_name: string;
  property_address: string;
  room_type_name: string | null;
  room_type_price: number | null;
  room_type_features: string[] | null;
  status: string;
  rent_status: string;
  move_in_date: string;
  move_out_date: string | null;
  landlord_name: string;
  landlord_phone: string | null;
}

export function TenantAccommodationCard() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<TenantRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!client) { setLoading(false); return; }

      const { data: occupancies } = await (supabase as any)
        .from("room_occupancies")
        .select("id, property_id, status, rent_status, move_in_date, move_out_date, room_type_id, properties(property_name, address, landlord_name, landlord_phone), room_types(name, price, features)")
        .eq("client_id", client.id)
        .in("status", ["occupied", "at_risk"])
        .order("move_in_date", { ascending: false });

      setRooms((occupancies || []).map((o: any) => ({
        id: o.id,
        property_id: o.property_id,
        property_name: o.properties?.property_name || "Unknown",
        property_address: o.properties?.address || "",
        room_type_name: o.room_types?.name || null,
        room_type_price: o.room_types?.price || null,
        room_type_features: o.room_types?.features || null,
        status: o.status,
        rent_status: o.rent_status,
        move_in_date: o.move_in_date,
        move_out_date: o.move_out_date,
        landlord_name: o.properties?.landlord_name || "—",
        landlord_phone: o.properties?.landlord_phone || null,
      })));
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading || rooms.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-semibold flex items-center gap-2">
        <Home className="h-5 w-5 text-primary" /> My Accommodation
      </h3>

      {rooms.map((room) => (
        <motion.div key={room.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/20 card-elevated overflow-hidden">
            <div className="h-1.5 w-full gradient-primary" />
            <CardContent className="p-5 space-y-4">
              {/* Property & Room Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-primary" />
                    <h4 className="font-display font-bold text-base">{room.property_name}</h4>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {room.property_address}
                  </div>
                </div>
                <Badge variant="outline" className={
                  room.status === "occupied" ? "bg-success/10 text-success border-success/20" :
                  "bg-warning/10 text-warning border-warning/20"
                }>
                  {room.status === "occupied" ? "Active Tenant" : "At Risk"}
                </Badge>
              </div>

              {/* Room Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {room.room_type_name && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <DoorOpen className="h-3 w-3" /> Room Type
                    </div>
                    <p className="text-sm font-semibold">{room.room_type_name}</p>
                  </div>
                )}
                {room.room_type_price && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Banknote className="h-3 w-3" /> Rent
                    </div>
                    <p className="text-sm font-semibold text-primary">₦{room.room_type_price.toLocaleString()}</p>
                  </div>
                )}
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <CalendarDays className="h-3 w-3" /> Move-in
                  </div>
                  <p className="text-sm font-semibold">{new Date(room.move_in_date).toLocaleDateString()}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Banknote className="h-3 w-3" /> Rent Status
                  </div>
                  <Badge variant="outline" className={
                    room.rent_status === "current" ? "bg-success/10 text-success" :
                    room.rent_status === "overdue" ? "bg-destructive/10 text-destructive" :
                    "bg-warning/10 text-warning"
                  }>
                    {room.rent_status}
                  </Badge>
                </div>
              </div>

              {/* Room Features */}
              {room.room_type_features && room.room_type_features.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Room Features</p>
                  <div className="flex flex-wrap gap-1.5">
                    {room.room_type_features.map((f, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Landlord Info */}
              <div className="rounded-lg bg-muted/30 p-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Landlord</p>
                  <p className="text-sm font-medium">{room.landlord_name}</p>
                  {room.landlord_phone && <p className="text-xs text-muted-foreground">{room.landlord_phone}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
