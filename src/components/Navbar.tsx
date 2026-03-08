import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Building2, User, Handshake, Home, MessageCircle } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import mycribLogo from "@/assets/mycrib-logo.png";

export function Navbar() {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const isAdmin = userRole === "super_admin" || userRole === "manager" || userRole === "verifier";
  const isLandlord = userRole === "landlord";

  return (
    <header className="sticky top-0 z-50 glass border-b">
      <div className="container flex h-16 items-center justify-between">
       <Link to="/" className="flex items-center gap-2">
          <img src={mycribLogo} alt="MyCrib.ng" className="h-10 w-10 rounded-lg object-contain" />
          <span className="font-display text-xl font-bold text-foreground">MyCrib.ng</span>
        </Link>
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
              {isLandlord && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/landlord")}>
                    <Home className="mr-1.5 h-4 w-4" />
                    <span className="hidden sm:inline">My Properties</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/landlord/register")}>
                    <Building2 className="mr-1.5 h-4 w-4" />
                    <span className="hidden sm:inline">Add Property</span>
                  </Button>
                </>
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
      </div>
    </header>
  );
}
