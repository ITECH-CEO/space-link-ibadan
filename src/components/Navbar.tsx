import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogOut, LayoutDashboard, Building2, User, Handshake, Home, MessageCircle, Menu, Phone } from "lucide-react";
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

  const NavItems = () => (
    <>
      <Button variant="ghost" size="sm" onClick={() => navAction("/properties")}>
        <Building2 className="mr-1.5 h-4 w-4" /> Properties
      </Button>
      {user ? (
        <>
          {!isAdmin && !isLandlord && (
            <Button variant="ghost" size="sm" onClick={() => navAction("/my-matches")}>
              <Handshake className="mr-1.5 h-4 w-4" /> My Matches
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => navAction("/messages")}>
            <MessageCircle className="mr-1.5 h-4 w-4" /> Messages
          </Button>
          {isLandlord && (
            <Button variant="ghost" size="sm" onClick={() => navAction("/landlord")}>
              <Home className="mr-1.5 h-4 w-4" /> My Properties
            </Button>
          )}
          {(isLandlord || !isAdmin) && (
            <Button variant="ghost" size="sm" onClick={() => navAction("/landlord/register")}>
              <Building2 className="mr-1.5 h-4 w-4" /> {isLandlord ? "Add Property" : "List Property"}
            </Button>
          )}
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => navAction("/dashboard")}>
              <LayoutDashboard className="mr-1.5 h-4 w-4" /> Dashboard
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => navAction("/profile")}>
            <User className="mr-1.5 h-4 w-4" /> Profile
          </Button>
          <Button variant="outline" size="sm" onClick={() => { signOut(); setOpen(false); }}>
            <LogOut className="mr-1.5 h-4 w-4" /> Sign Out
          </Button>
        </>
      ) : (
        <>
          <Button variant="ghost" size="sm" onClick={() => navAction("/auth")}>
            Sign In
          </Button>
          <Button size="sm" onClick={() => navAction("/auth?mode=signup")} className="gradient-primary text-primary-foreground">
            Get Started
          </Button>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 glass border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={mycribLogo} alt="MyCrib.ng" className="h-10 w-10 rounded-lg object-contain" />
          <span className="font-display text-xl font-bold text-foreground">MyCrib.ng</span>
        </Link>

        {/* Support contact — Hotels.ng style */}
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
                {/* Mobile support contact */}
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
                  <NavItems />
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <nav className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => navigate("/properties")}>
              <Building2 className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Properties</span>
            </Button>
            {user ? (
              <>
                {!isAdmin && !isLandlord && (
                  <Button variant="ghost" size="sm" onClick={() => navigate("/my-matches")}>
                    <Handshake className="mr-1.5 h-4 w-4" />
                    <span className="hidden sm:inline">My Matches</span>
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => navigate("/messages")}>
                  <MessageCircle className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">Messages</span>
                </Button>
                {isLandlord && (
                  <Button variant="ghost" size="sm" onClick={() => navigate("/landlord")}>
                    <Home className="mr-1.5 h-4 w-4" />
                    <span className="hidden sm:inline">My Properties</span>
                  </Button>
                )}
                {(isLandlord || !isAdmin) && (
                  <Button variant="ghost" size="sm" onClick={() => navigate("/landlord/register")}>
                    <Building2 className="mr-1.5 h-4 w-4" />
                    <span className="hidden sm:inline">{isLandlord ? "Add Property" : "List Property"}</span>
                  </Button>
                )}
                {isAdmin && (
                  <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                    <LayoutDashboard className="mr-1.5 h-4 w-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Button>
                )}
                <NotificationBell />
                <Button variant="ghost" size="sm" onClick={() => navigate("/profile")}>
                  <User className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
                <Button size="sm" onClick={() => navigate("/auth?mode=signup")} className="gradient-primary text-primary-foreground">
                  Get Started
                </Button>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
