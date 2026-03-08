import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, DollarSign, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function HeroSearch() {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [type, setType] = useState("all");
  const [budget, setBudget] = useState("all");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set("search", location);
    if (type !== "all") params.set("type", type);
    if (budget !== "all") params.set("budget", budget);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="mx-auto mt-10 max-w-3xl">
      <div className="rounded-2xl bg-card/95 p-3 shadow-2xl backdrop-blur-sm">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Campus or location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 border-0 bg-muted/50 h-12"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="border-0 bg-muted/50 h-12">
              <Home className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="hostel">Hostel</SelectItem>
              <SelectItem value="single">Self-con</SelectItem>
              <SelectItem value="shared">Shared</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} className="gradient-accent text-accent-foreground h-12 font-semibold">
            <Search className="mr-2 h-4 w-4" /> Search
          </Button>
        </div>
      </div>
    </div>
  );
}
