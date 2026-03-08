import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface PropertyForMap {
  id: string;
  property_name: string;
  address: string;
  property_type: string;
  latitude?: number | null;
  longitude?: number | null;
  available_rooms?: number | null;
  total_rooms?: number | null;
}

export function PropertyMap({ properties }: { properties: PropertyForMap[] }) {
  const mappable = useMemo(
    () => properties.filter((p) => p.latitude && p.longitude),
    [properties]
  );

  // Default center: University of Ibadan area
  const center = useMemo(() => {
    if (mappable.length > 0) {
      const lat = mappable.reduce((s, p) => s + (p.latitude || 0), 0) / mappable.length;
      const lng = mappable.reduce((s, p) => s + (p.longitude || 0), 0) / mappable.length;
      return [lat, lng] as [number, number];
    }
    return [7.3775, 3.9470] as [number, number]; // Default to UI area
  }, [mappable]);

  if (mappable.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/30">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground">No properties have location coordinates yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Admins can add coordinates to enable map view.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border" style={{ height: "500px" }}>
      <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mappable.map((p) => (
          <Marker key={p.id} position={[p.latitude!, p.longitude!]}>
            <Popup>
              <div className="space-y-1 min-w-[180px]">
                <h3 className="font-semibold text-sm">{p.property_name}</h3>
                <p className="text-xs text-muted-foreground">{p.address}</p>
                <Badge variant="secondary" className="text-xs capitalize">{p.property_type}</Badge>
                <p className="text-xs">{p.available_rooms}/{p.total_rooms} rooms available</p>
                <Link to={`/property/${p.id}`}>
                  <Button size="sm" className="w-full mt-1 text-xs">View Details</Button>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
