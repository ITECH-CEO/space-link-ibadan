import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PropertySwitcher } from "@/components/landlord/PropertySwitcher";
import { LandlordOccupancyTab } from "@/components/landlord/LandlordOccupancyTab";
import { LandlordTenantsTab } from "@/components/landlord/LandlordTenantsTab";
import { LandlordRoomsTab } from "@/components/landlord/LandlordRoomsTab";
import { LandlordFinancialsTab } from "@/components/landlord/LandlordFinancialsTab";
import { LandlordMaintenanceTab } from "@/components/landlord/LandlordMaintenanceTab";
import { LandlordInspectionsTab } from "@/components/landlord/LandlordInspectionsTab";
import { LandlordRentTab } from "@/components/landlord/LandlordRentTab";
import { LandlordLeaseTab } from "@/components/landlord/LandlordLeaseTab";
import { Building2, Users, DoorOpen, Banknote, Wrench, CalendarDays, Bell, Phone, TrendingUp, FileText, PieChart } from "lucide-react";
import { motion } from "framer-motion";

export default function LandlordDashboard() {
  const { user, userRole, loading } = useAuth();
  const [properties, setProperties] = useState<{ id: string; property_name: string }[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("all");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("properties")
      .select("id, property_name")
      .eq("owner_user_id", user.id)
      .then(({ data }) => setProperties(data || []));
  }, [user]);

  if (loading) return null;
  if (!user || userRole !== "landlord") return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold">Property Management</h1>
              <p className="text-muted-foreground">Manage your properties, tenants, finances, and maintenance</p>
            </div>
            <div className="flex items-center gap-3">
              <PropertySwitcher
                properties={properties}
                selectedPropertyId={selectedPropertyId}
                onSelect={setSelectedPropertyId}
              />
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 capitalize">
                Landlord
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Quick Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="pt-5 pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">How It Works</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Your properties are managed by MyCrib.ng admins. This dashboard shows occupancy, tenants, rooms, finances, inspections, and lets you submit maintenance complaints.
                  </p>
                </div>
                <div className="flex gap-2">
                  <a href="https://wa.me/2349137425552" target="_blank" rel="noopener noreferrer">
                    <Badge className="bg-success/10 text-success hover:bg-success/20 cursor-pointer gap-1.5 py-1.5 px-3">
                      <Phone className="h-3.5 w-3.5" /> WhatsApp Support
                    </Badge>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="overview">
            <TabsList className="mb-6 flex-wrap">
              <TabsTrigger value="overview"><Building2 className="mr-2 h-4 w-4" />Overview</TabsTrigger>
              <TabsTrigger value="tenants"><Users className="mr-2 h-4 w-4" />Tenants</TabsTrigger>
              <TabsTrigger value="rooms"><DoorOpen className="mr-2 h-4 w-4" />Rooms</TabsTrigger>
              <TabsTrigger value="financials"><PieChart className="mr-2 h-4 w-4" />Financials</TabsTrigger>
              <TabsTrigger value="rent"><TrendingUp className="mr-2 h-4 w-4" />Rent Tracking</TabsTrigger>
              <TabsTrigger value="inspections"><CalendarDays className="mr-2 h-4 w-4" />Inspections</TabsTrigger>
              <TabsTrigger value="maintenance"><Wrench className="mr-2 h-4 w-4" />Maintenance</TabsTrigger>
              <TabsTrigger value="leases"><FileText className="mr-2 h-4 w-4" />Leases</TabsTrigger>
            </TabsList>
            <TabsContent value="overview"><LandlordOccupancyTab /></TabsContent>
            <TabsContent value="tenants"><LandlordTenantsTab selectedPropertyId={selectedPropertyId} /></TabsContent>
            <TabsContent value="rooms"><LandlordRoomsTab selectedPropertyId={selectedPropertyId} /></TabsContent>
            <TabsContent value="financials"><LandlordFinancialsTab selectedPropertyId={selectedPropertyId} /></TabsContent>
            <TabsContent value="rent"><LandlordRentTab /></TabsContent>
            <TabsContent value="inspections"><LandlordInspectionsTab /></TabsContent>
            <TabsContent value="maintenance"><LandlordMaintenanceTab /></TabsContent>
            <TabsContent value="leases"><LandlordLeaseTab /></TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
