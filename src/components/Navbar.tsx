import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Building2, User } from "lucide-react";
import spacelinkLogo from "@/assets/spacelink-logo.jpg";

export function Navbar() {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 glass border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={spacelinkLogo} alt="SpaceLink" className="h-10 w-10 rounded-lg object-cover" />
          <span className="font-display text-xl font-bold text-foreground">SpaceLink</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/properties")}>
            <Building2 className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Properties</span>
          </Button>
          {user ? (
            <>
              {userRole && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                  <LayoutDashboard className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              )}
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
