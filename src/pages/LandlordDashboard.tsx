import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LandlordOccupancyTab } from "@/components/landlord/LandlordOccupancyTab";
import { LandlordPaymentsTab } from "@/components/landlord/LandlordPaymentsTab";
import { LandlordMaintenanceTab } from "@/components/landlord/LandlordMaintenanceTab";
import { LandlordInspectionsTab } from "@/components/landlord/LandlordInspectionsTab";
import { Building2, DollarSign, Wrench, CalendarDays } from "lucide-react";

export default function LandlordDashboard() {
  const { user, userRole, loading } = useAuth();

  if (loading) return null;
  if (!user || userRole !== "landlord") return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="mb-6 flex items-center gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">Landlord Dashboard</h1>
            <p className="text-muted-foreground">Monitor your properties and manage tenants</p>
          </div>
          <Badge variant="outline" className="ml-auto bg-primary/10 text-primary border-primary/20 capitalize">
            Landlord
          </Badge>
        </div>
        <Tabs defaultValue="occupancy">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="occupancy"><Building2 className="mr-2 h-4 w-4" />Occupancy</TabsTrigger>
            <TabsTrigger value="inspections"><CalendarDays className="mr-2 h-4 w-4" />Inspections</TabsTrigger>
            <TabsTrigger value="payments"><DollarSign className="mr-2 h-4 w-4" />Payments</TabsTrigger>
            <TabsTrigger value="maintenance"><Wrench className="mr-2 h-4 w-4" />Maintenance</TabsTrigger>
          </TabsList>
          <TabsContent value="occupancy"><LandlordOccupancyTab /></TabsContent>
          <TabsContent value="inspections"><LandlordInspectionsTab /></TabsContent>
          <TabsContent value="payments"><LandlordPaymentsTab /></TabsContent>
          <TabsContent value="maintenance"><LandlordMaintenanceTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
