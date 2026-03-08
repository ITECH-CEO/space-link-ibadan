import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  LayoutDashboard, Users, Building2, Handshake, DollarSign,
  ShieldCheck, UserPlus, BarChart3, CalendarDays, Settings,
  LogOut, Moon, Sun, Home,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const navItems = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, roles: ["super_admin", "manager", "verifier"] },
  { key: "clients", label: "Clients", icon: Users, roles: ["super_admin", "manager", "verifier"] },
  { key: "properties", label: "Properties", icon: Building2, roles: ["super_admin", "manager", "verifier"] },
  { key: "matches", label: "Matches", icon: Handshake, roles: ["super_admin", "manager"] },
  { key: "roommates", label: "Roommates", icon: UserPlus, roles: ["super_admin", "manager"] },
  { key: "commissions", label: "Commissions", icon: DollarSign, roles: ["super_admin", "manager"] },
  { key: "inspections", label: "Inspections", icon: CalendarDays, roles: ["super_admin", "manager"] },
  { key: "admins", label: "Admins", icon: ShieldCheck, roles: ["super_admin"] },
  { key: "analytics", label: "Analytics", icon: BarChart3, roles: ["super_admin", "manager"] },
  { key: "fees", label: "Fees", icon: Settings, roles: ["super_admin"] },
];

const tabComponents: Record<string, React.ComponentType> = {
  overview: OverviewTab,
  clients: ClientsTab,
  properties: PropertiesTab,
  matches: MatchesTab,
  roommates: RoommateMatchesTab,
  commissions: CommissionsTab,
  inspections: InspectionsTab,
  admins: AdminsTab,
  analytics: AnalyticsTab,
  fees: FeesTab,
};

function DashboardSidebar({ activeTab, setActiveTab, userRole }: {
  activeTab: string;
  setActiveTab: (t: string) => void;
  userRole: string;
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
      <SidebarContent className="pt-4">
        {/* Logo area */}
        <div className={`px-4 pb-4 mb-2 border-b border-sidebar-border ${collapsed ? "px-2" : ""}`}>
          {collapsed ? (
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center mx-auto">
              <span className="text-xs font-bold text-primary-foreground">M</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary-foreground">M</span>
              </div>
              <div>
                <p className="text-sm font-display font-bold text-sidebar-foreground">MyCrib.ng</p>
                <p className="text-[10px] text-sidebar-foreground/50">Admin Panel</p>
              </div>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNav.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={activeTab === item.key}
                    onClick={() => setActiveTab(item.key)}
                    tooltip={item.label}
                    className={`transition-all duration-200 ${
                      activeTab === item.key
                        ? "bg-sidebar-primary/15 text-sidebar-primary border-l-2 border-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 space-y-1">
        <SidebarMenuButton
          onClick={() => navigate("/")}
          tooltip="Back to site"
          className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <Home className="h-4 w-4" />
          {!collapsed && <span>Back to site</span>}
        </SidebarMenuButton>
        <SidebarMenuButton
          onClick={toggleDark}
          tooltip={isDark ? "Light mode" : "Dark mode"}
          className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span>{isDark ? "Light mode" : "Dark mode"}</span>}
        </SidebarMenuButton>
        <SidebarMenuButton
          onClick={() => signOut()}
          tooltip="Sign out"
          className="text-destructive/70 hover:text-destructive hover:bg-destructive/10"
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
    super_admin: "bg-primary/10 text-primary border-primary/30",
    manager: "bg-accent/10 text-accent border-accent/30",
    verifier: "bg-muted text-muted-foreground border-border",
  };

  const ActiveComponent = tabComponents[activeTab] || OverviewTab;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-14 flex items-center gap-3 border-b border-border bg-card/50 backdrop-blur-sm px-4 sticky top-0 z-10">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex-1">
              <h1 className="text-lg font-display font-bold capitalize">{activeTab}</h1>
            </div>
            <Badge variant="outline" className={`capitalize text-xs ${roleColors[userRole] || ""}`}>
              {roleLabel}
            </Badge>
          </header>

          {/* Main content */}
          <main className="flex-1 p-6 overflow-auto">
            <ActiveComponent />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
