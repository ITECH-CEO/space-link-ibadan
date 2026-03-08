import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LandlordOccupancyTab } from "@/components/landlord/LandlordOccupancyTab";
import { LandlordPaymentsTab } from "@/components/landlord/LandlordPaymentsTab";
import { LandlordMaintenanceTab } from "@/components/landlord/LandlordMaintenanceTab";
import { LandlordInspectionsTab } from "@/components/landlord/LandlordInspectionsTab";
import { LandlordRentTab } from "@/components/landlord/LandlordRentTab";
import { LandlordLeaseTab } from "@/components/landlord/LandlordLeaseTab";
import { Building2, Banknote, Wrench, CalendarDays, Bell, Phone, MessageSquare, TrendingUp, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function LandlordDashboard() {
  const { user, userRole, loading } = useAuth();

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
              <h1 className="font-display text-3xl font-bold">Landlord Dashboard</h1>
              <p className="text-muted-foreground">View your property performance and submit complaints</p>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 capitalize">
              Landlord
            </Badge>
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
                    Your properties are managed by MyCrib.ng admins. This dashboard shows your occupancy, inspections, payments, and lets you submit maintenance complaints. For any issues, contact support.
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
          <Tabs defaultValue="occupancy">
            <TabsList className="mb-6 flex-wrap">
              <TabsTrigger value="occupancy"><Building2 className="mr-2 h-4 w-4" />Occupancy</TabsTrigger>
              <TabsTrigger value="inspections"><CalendarDays className="mr-2 h-4 w-4" />Inspections</TabsTrigger>
              <TabsTrigger value="payments"><Banknote className="mr-2 h-4 w-4" />Payments</TabsTrigger>
              <TabsTrigger value="complaints"><Wrench className="mr-2 h-4 w-4" />Complaints</TabsTrigger>
              <TabsTrigger value="rent"><TrendingUp className="mr-2 h-4 w-4" />Rent Tracking</TabsTrigger>
              <TabsTrigger value="leases"><FileText className="mr-2 h-4 w-4" />Leases</TabsTrigger>
            </TabsList>
            <TabsContent value="occupancy"><LandlordOccupancyTab /></TabsContent>
            <TabsContent value="inspections"><LandlordInspectionsTab /></TabsContent>
            <TabsContent value="payments"><LandlordPaymentsTab /></TabsContent>
            <TabsContent value="complaints"><LandlordMaintenanceTab /></TabsContent>
            <TabsContent value="rent"><LandlordRentTab /></TabsContent>
            <TabsContent value="leases"><LandlordLeaseTab /></TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
