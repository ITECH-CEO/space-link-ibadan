import { Link } from "react-router-dom";
import { Building2, Phone, MapPin, HelpCircle, MessageSquare, Mail, Home } from "lucide-react";
import mycribLogo from "@/assets/mycrib-logo.png";

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img src={mycribLogo} alt="MyCrib.ng" className="h-9 w-9 rounded-lg object-contain" />
              <span className="font-display text-lg font-bold">MyCrib.ng</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nigeria's trusted student accommodation platform. Verified properties, smart matching, secure payments.
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> Nigeria
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-display font-semibold text-sm">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/properties" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Browse Properties
              </Link>
              <Link to="/support" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5" /> Help & FAQ
              </Link>
              <Link to="/auth?mode=signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <Home className="h-3.5 w-3.5" /> Get Started
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="font-display font-semibold text-sm">Contact Us</h4>
            <div className="flex flex-col gap-2">
              <a href="tel:+2349137425552" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> +234 913 742 5552
              </a>
              <a href="https://wa.me/2349137425552" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> WhatsApp Support
              </a>
              <a href="mailto:support@mycrib.ng" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> support@mycrib.ng
              </a>
            </div>
          </div>

          {/* Hours */}
          <div className="space-y-3">
            <h4 className="font-display font-semibold text-sm">Support Hours</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Monday – Saturday</p>
              <p className="font-medium text-foreground">8:00 AM – 8:00 PM</p>
              <p className="text-xs mt-2">WhatsApp available 24/7</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MyCrib.ng — Verified. Secure. Connected.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/support" className="hover:text-foreground transition-colors">Help</Link>
            <span>•</span>
            <Link to="/properties" className="hover:text-foreground transition-colors">Properties</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
