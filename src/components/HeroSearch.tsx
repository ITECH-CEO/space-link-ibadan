import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Home, DollarSign } from "lucide-react";
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
    <div className="mx-auto mt-8 max-w-4xl">
      <div className="rounded-2xl bg-card p-4 shadow-2xl">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          {/* Location */}
          <div className="relative sm:col-span-2">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search for a campus or area..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 border-0 bg-muted/50 h-12 text-base"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          {/* Type */}
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
          {/* Budget */}
          <Select value={budget} onValueChange={setBudget}>
            <SelectTrigger className="border-0 bg-muted/50 h-12">
              <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Budget" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Budget</SelectItem>
              <SelectItem value="50000">Under ₦50,000</SelectItem>
              <SelectItem value="100000">Under ₦100,000</SelectItem>
              <SelectItem value="200000">Under ₦200,000</SelectItem>
              <SelectItem value="500000">Under ₦500,000</SelectItem>
            </SelectContent>
          </Select>
          {/* Search Button */}
          <Button onClick={handleSearch} className="gradient-accent text-accent-foreground h-12 font-semibold text-base">
            <Search className="mr-2 h-5 w-5" /> Find Properties
          </Button>
        </div>
      </div>
    </div>
  );
}
