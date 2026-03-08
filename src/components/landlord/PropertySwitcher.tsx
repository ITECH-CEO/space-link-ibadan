import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface Property {
  id: string;
  property_name: string;
}

interface PropertySwitcherProps {
  properties: Property[];
  selectedPropertyId: string;
  onSelect: (id: string) => void;
}

export function PropertySwitcher({ properties, selectedPropertyId, onSelect }: PropertySwitcherProps) {
  if (properties.length <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedPropertyId} onValueChange={onSelect}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="All Properties" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Properties</SelectItem>
          {properties.map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
