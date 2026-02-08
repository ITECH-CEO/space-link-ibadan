import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientsTab } from "@/components/dashboard/ClientsTab";
import { PropertiesTab } from "@/components/dashboard/PropertiesTab";
import { MatchesTab } from "@/components/dashboard/MatchesTab";
import { CommissionsTab } from "@/components/dashboard/CommissionsTab";
import { AdminsTab } from "@/components/dashboard/AdminsTab";
import { Users, Building2, Handshake, DollarSign, ShieldCheck } from "lucide-react";

export default function Dashboard() {
  const { user, userRole, loading } = useAuth();

  if (loading) return null;
  if (!user || !userRole) return <Navigate to="/" replace />;

  const isSuperAdmin = userRole === "super_admin";
  const isManager = userRole === "manager";
  const isVerifier = userRole === "verifier";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground capitalize">Role: {userRole?.replace("_", " ")}</p>
        </div>
        <Tabs defaultValue="clients">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="clients"><Users className="mr-2 h-4 w-4" />Clients</TabsTrigger>
            <TabsTrigger value="properties"><Building2 className="mr-2 h-4 w-4" />Properties</TabsTrigger>
            {(isSuperAdmin || isManager) && (
              <TabsTrigger value="matches"><Handshake className="mr-2 h-4 w-4" />Matches</TabsTrigger>
            )}
            {(isSuperAdmin || isManager) && (
              <TabsTrigger value="commissions"><DollarSign className="mr-2 h-4 w-4" />Commissions</TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="admins"><ShieldCheck className="mr-2 h-4 w-4" />Admins</TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="clients"><ClientsTab /></TabsContent>
          <TabsContent value="properties"><PropertiesTab /></TabsContent>
          {(isSuperAdmin || isManager) && <TabsContent value="matches"><MatchesTab /></TabsContent>}
          {(isSuperAdmin || isManager) && <TabsContent value="commissions"><CommissionsTab /></TabsContent>}
          {isSuperAdmin && <TabsContent value="admins"><AdminsTab /></TabsContent>}
        </Tabs>
      </main>
    </div>
  );
}
