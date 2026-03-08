import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientsTab } from "@/components/dashboard/ClientsTab";
import { PropertiesTab } from "@/components/dashboard/PropertiesTab";
import { MatchesTab } from "@/components/dashboard/MatchesTab";
import { RoommateMatchesTab } from "@/components/dashboard/RoommateMatchesTab";
import { CommissionsTab } from "@/components/dashboard/CommissionsTab";
import { AdminsTab } from "@/components/dashboard/AdminsTab";
import { AnalyticsTab } from "@/components/dashboard/AnalyticsTab";
import { Users, Building2, Handshake, DollarSign, ShieldCheck, UserPlus, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { user, userRole, loading } = useAuth();

  if (loading) return null;
  if (!user || !userRole) return <Navigate to="/" replace />;

  const isSuperAdmin = userRole === "super_admin";
  const isManager = userRole === "manager";
  const isVerifier = userRole === "verifier";

  const roleLabel = userRole.replace("_", " ");

  const roleColors: Record<string, string> = {
    super_admin: "bg-primary/10 text-primary border-primary/20",
    manager: "bg-accent/10 text-accent-foreground border-accent/20",
    verifier: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="mb-6 flex items-center gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Manage MyCrib.ng operations</p>
          </div>
          <Badge variant="outline" className={`capitalize ml-auto ${roleColors[userRole] || ""}`}>
            {roleLabel}
          </Badge>
        </div>
        <Tabs defaultValue="clients">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="clients"><Users className="mr-2 h-4 w-4" />Clients</TabsTrigger>
            <TabsTrigger value="properties"><Building2 className="mr-2 h-4 w-4" />Properties</TabsTrigger>
            {(isSuperAdmin || isManager) && (
              <TabsTrigger value="matches"><Handshake className="mr-2 h-4 w-4" />Matches</TabsTrigger>
            )}
            {(isSuperAdmin || isManager) && (
              <TabsTrigger value="roommates"><UserPlus className="mr-2 h-4 w-4" />Roommates</TabsTrigger>
            )}
            {(isSuperAdmin || isManager) && (
              <TabsTrigger value="commissions"><DollarSign className="mr-2 h-4 w-4" />Commissions</TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="admins"><ShieldCheck className="mr-2 h-4 w-4" />Admins</TabsTrigger>
            )}
            {(isSuperAdmin || isManager) && (
              <TabsTrigger value="analytics"><BarChart3 className="mr-2 h-4 w-4" />Analytics</TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="clients"><ClientsTab /></TabsContent>
          <TabsContent value="properties"><PropertiesTab /></TabsContent>
          {(isSuperAdmin || isManager) && <TabsContent value="matches"><MatchesTab /></TabsContent>}
          {(isSuperAdmin || isManager) && <TabsContent value="roommates"><RoommateMatchesTab /></TabsContent>}
          {(isSuperAdmin || isManager) && <TabsContent value="commissions"><CommissionsTab /></TabsContent>}
          {isSuperAdmin && <TabsContent value="admins"><AdminsTab /></TabsContent>}
          {(isSuperAdmin || isManager) && <TabsContent value="analytics"><AnalyticsTab /></TabsContent>}
        </Tabs>
      </main>
    </div>
  );
}
