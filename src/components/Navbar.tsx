import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogOut, LayoutDashboard, Building2, User, Home, MessageCircle, Menu, Phone, HelpCircle } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { useIsMobile } from "@/hooks/use-mobile";
import mycribLogo from "@/assets/mycrib-logo.png";
import { useState } from "react";

export function Navbar() {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const isAdmin = userRole === "super_admin" || userRole === "manager" || userRole === "verifier";
  const isLandlord = userRole === "landlord";

  const navAction = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  // Simplified nav items based on role
  const getNavItems = () => {
    if (!user) return [];

    const items: { path: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [];

    if (isAdmin) {
      items.push({ path: "/dashboard", label: "Dashboard", icon: LayoutDashboard });
      items.push({ path: "/properties", label: "Properties", icon: Building2 });
    } else if (isLandlord) {
      items.push({ path: "/landlord", label: "My Dashboard", icon: Home });
      items.push({ path: "/properties", label: "Properties", icon: Building2 });
    } else {
      // Client / Tenant — simplified
      items.push({ path: "/my-matches", label: "My Dashboard", icon: Home });
      items.push({ path: "/properties", label: "Properties", icon: Building2 });
    }

    items.push({ path: "/messages", label: "Messages", icon: MessageCircle });
    items.push({ path: "/support", label: "Support", icon: HelpCircle });

    return items;
  };

  const navItems = getNavItems();

  return (
    <header className="sticky top-0 z-50 glass border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={mycribLogo} alt="MyCrib.ng" className="h-10 w-10 rounded-lg object-contain" />
          <span className="font-display text-xl font-bold text-foreground">MyCrib.ng</span>
        </Link>

        {/* Support contact */}
        <a
          href="https://wa.me/2349137425552"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-success/10">
            <Phone className="h-4 w-4 text-success" />
          </div>
          <div className="leading-tight">
            <div className="text-[10px] text-muted-foreground">Call/WhatsApp us</div>
            <div className="font-semibold text-foreground text-xs">+234 913 742 5552</div>
          </div>
        </a>

        {isMobile ? (
          <div className="flex items-center gap-1">
            {user && <NotificationBell />}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 pt-12">
                <a
                  href="https://wa.me/2349137425552"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-success/10 text-sm"
                >
                  <Phone className="h-4 w-4 text-success" />
                  <span className="font-semibold text-foreground">+234 913 742 5552</span>
                </a>
                <nav className="flex flex-col gap-1">
                  {!user ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => navAction("/properties")}>
                        <Building2 className="mr-1.5 h-4 w-4" /> Properties
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navAction("/support")}>
                        <HelpCircle className="mr-1.5 h-4 w-4" /> Support
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navAction("/auth")}>Sign In</Button>
                      <Button size="sm" onClick={() => navAction("/auth?mode=signup")} className="gradient-primary text-primary-foreground">Get Started</Button>
                    </>
                  ) : (
                    <>
                      {navItems.map((item) => (
                        <Button key={item.path} variant="ghost" size="sm" onClick={() => navAction(item.path)}>
                          <item.icon className="mr-1.5 h-4 w-4" /> {item.label}
                        </Button>
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => navAction("/profile")}>
                        <User className="mr-1.5 h-4 w-4" /> Profile
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { signOut(); setOpen(false); }}>
                        <LogOut className="mr-1.5 h-4 w-4" /> Sign Out
                      </Button>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <nav className="flex items-center gap-1">
            {!user ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/properties")}>
                  <Building2 className="mr-1.5 h-4 w-4" /><span className="hidden sm:inline">Properties</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/support")}>
                  <HelpCircle className="mr-1.5 h-4 w-4" /><span className="hidden sm:inline">Support</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>Sign In</Button>
                <Button size="sm" onClick={() => navigate("/auth?mode=signup")} className="gradient-primary text-primary-foreground">Get Started</Button>
              </>
            ) : (
              <>
                {navItems.map((item) => (
                  <Button key={item.path} variant="ghost" size="sm" onClick={() => navigate(item.path)}>
                    <item.icon className="mr-1.5 h-4 w-4" /><span className="hidden sm:inline">{item.label}</span>
                  </Button>
                ))}
                <NotificationBell />
                <Button variant="ghost" size="sm" onClick={() => navigate("/profile")}>
                  <User className="mr-1.5 h-4 w-4" /><span className="hidden sm:inline">Profile</span>
                </Button>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="mr-1.5 h-4 w-4" /><span className="hidden sm:inline">Sign Out</span>
                </Button>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
