import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  SidebarProvider, SidebarTrigger, Sidebar, SidebarContent,
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { ClientsTab } from "@/components/dashboard/ClientsTab";
import { PropertiesTab } from "@/components/dashboard/PropertiesTab";
import { MatchesTab } from "@/components/dashboard/MatchesTab";
import { RoommateMatchesTab } from "@/components/dashboard/RoommateMatchesTab";
import { CommissionsTab } from "@/components/dashboard/CommissionsTab";
import { AdminsTab } from "@/components/dashboard/AdminsTab";
import { AnalyticsTab } from "@/components/dashboard/AnalyticsTab";
import { InspectionsTab } from "@/components/dashboard/InspectionsTab";
import { FeesTab } from "@/components/dashboard/FeesTab";
import { SettingsTab } from "@/components/dashboard/SettingsTab";
import { RentTrackingTab } from "@/components/dashboard/RentTrackingTab";
import { ComplaintsTab } from "@/components/dashboard/ComplaintsTab";
import { PlatformComplaintsTab } from "@/components/dashboard/PlatformComplaintsTab";
import { OccupancyTab } from "@/components/dashboard/OccupancyTab";
import { SponsorsTab } from "@/components/dashboard/SponsorsTab";
import {
  LayoutDashboard, Users, Building2, Handshake, Banknote, Wrench,
  ShieldCheck, UserPlus, BarChart3, CalendarDays, Settings,
  LogOut, Moon, Sun, Home, ChevronRight, MessageSquareWarning, Award,
} from "lucide-react";

const navItems = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, roles: ["super_admin", "manager", "verifier"] },
  { key: "clients", label: "Clients", icon: Users, roles: ["super_admin", "manager", "verifier"] },
  { key: "properties", label: "Properties", icon: Building2, roles: ["super_admin", "manager", "verifier"] },
  { key: "matches", label: "Matches", icon: Handshake, roles: ["super_admin", "manager"] },
  { key: "roommates", label: "Roommates", icon: UserPlus, roles: ["super_admin", "manager"] },
  { key: "commissions", label: "Commissions", icon: Banknote, roles: ["super_admin", "manager"] },
  { key: "inspections", label: "Inspections", icon: CalendarDays, roles: ["super_admin", "manager"] },
  { key: "rent", label: "Rent Tracking", icon: Banknote, roles: ["super_admin", "manager"] },
  { key: "complaints", label: "Maintenance", icon: Wrench, roles: ["super_admin", "manager"] },
  { key: "platform_complaints", label: "Platform Complaints", icon: MessageSquareWarning, roles: ["super_admin", "manager"] },
  { key: "occupancy", label: "Occupancy", icon: Building2, roles: ["super_admin", "manager"] },
  { key: "sponsors", label: "Sponsors", icon: Award, roles: ["super_admin", "manager"] },
  { key: "admins", label: "Admins", icon: ShieldCheck, roles: ["super_admin"] },
  { key: "analytics", label: "Analytics", icon: BarChart3, roles: ["super_admin", "manager"] },
  { key: "fees", label: "Fees", icon: Settings, roles: ["super_admin"] },
  { key: "settings", label: "Settings", icon: Settings, roles: ["super_admin"] },
];

const tabComponents: Record<string, React.ComponentType> = {
  overview: OverviewTab, clients: ClientsTab, properties: PropertiesTab,
  matches: MatchesTab, roommates: RoommateMatchesTab, commissions: CommissionsTab,
  inspections: InspectionsTab, rent: RentTrackingTab, complaints: ComplaintsTab,
  platform_complaints: PlatformComplaintsTab, occupancy: OccupancyTab,
  admins: AdminsTab, analytics: AnalyticsTab, fees: FeesTab, settings: SettingsTab,
};

function DashboardSidebar({ activeTab, setActiveTab, userRole }: {
  activeTab: string; setActiveTab: (t: string) => void; userRole: string;
}) {
  const { signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains("dark"));

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
  };

  const filteredNav = navItems.filter(item => item.roles.includes(userRole));

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="gradient-sidebar pt-5">
        {/* Logo */}
        <div className={`px-4 pb-5 mb-3 border-b border-sidebar-border/40 ${collapsed ? "px-2" : ""}`}>
          {collapsed ? (
            <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center mx-auto shadow-lg">
              <span className="text-sm font-bold text-primary-foreground">M</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-lg">
                <span className="text-sm font-bold text-primary-foreground">M</span>
              </div>
              <div>
                <p className="text-sm font-display font-bold text-sidebar-foreground tracking-tight">MyCrib.ng</p>
                <p className="text-[10px] text-sidebar-primary font-medium">Admin Console</p>
              </div>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/30 text-[10px] uppercase tracking-[0.15em] font-semibold mb-1">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {filteredNav.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={activeTab === item.key}
                    onClick={() => setActiveTab(item.key)}
                    tooltip={item.label}
                    className={`rounded-lg transition-all duration-200 ${
                      activeTab === item.key
                        ? "bg-sidebar-primary/15 text-sidebar-primary font-semibold shadow-sm"
                        : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${activeTab === item.key ? "text-sidebar-primary" : ""}`} />
                    {!collapsed && (
                      <span className="flex-1 flex items-center justify-between">
                        {item.label}
                        {activeTab === item.key && <ChevronRight className="h-3 w-3 opacity-50" />}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gradient-sidebar border-t border-sidebar-border/40 p-3 space-y-0.5">
        <SidebarMenuButton
          onClick={() => navigate("/")}
          tooltip="Back to site"
          className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 rounded-lg"
        >
          <Home className="h-4 w-4" />
          {!collapsed && <span>Back to site</span>}
        </SidebarMenuButton>
        <SidebarMenuButton
          onClick={toggleDark}
          tooltip={isDark ? "Light mode" : "Dark mode"}
          className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 rounded-lg"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span>{isDark ? "Light mode" : "Dark mode"}</span>}
        </SidebarMenuButton>
        <SidebarMenuButton
          onClick={() => signOut()}
          tooltip="Sign out"
          className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-lg"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign out</span>}
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function Dashboard() {
  const { user, userRole, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  if (loading) return null;
  if (!user || !userRole) return <Navigate to="/" replace />;

  const roleLabel = userRole.replace("_", " ");
  const roleColors: Record<string, string> = {
    super_admin: "bg-primary/10 text-primary border-primary/25",
    manager: "bg-accent/10 text-accent border-accent/25",
    verifier: "bg-muted text-muted-foreground border-border",
  };

  const ActiveComponent = tabComponents[activeTab] || OverviewTab;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center gap-4 border-b border-border bg-card/80 backdrop-blur-md px-6 sticky top-0 z-10">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="h-5 w-px bg-border" />
            <div className="flex-1">
              <h1 className="text-xl font-display font-bold capitalize tracking-tight">{activeTab}</h1>
            </div>
            <Badge variant="outline" className={`capitalize text-xs font-medium px-3 py-1 ${roleColors[userRole] || ""}`}>
              {roleLabel}
            </Badge>
          </header>

          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            <ActiveComponent />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
