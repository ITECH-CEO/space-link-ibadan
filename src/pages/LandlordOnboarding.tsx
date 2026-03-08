import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Phone, MessageSquare, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function LandlordOnboarding() {
  const { user, userRole, loading } = useAuth();

  if (loading) return null;

  // Only admins can add properties — redirect others to info page
  const isAdmin = userRole === "super_admin" || userRole === "manager" || userRole === "verifier";

  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-2xl py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4 mb-6">
            <Building2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-3">List Your Property</h1>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Property listings on MyCrib.ng are managed by our admin team to ensure quality and verification standards. Contact us to get your property listed.
          </p>

          <Card className="text-left mb-6">
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold">How to list your property:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Contact our team via WhatsApp or phone call</li>
                <li>Our admin will visit and verify your property</li>
                <li>We'll take professional photos and collect property details</li>
                <li>Your property goes live on MyCrib.ng within 48 hours</li>
                <li>You'll get access to a landlord dashboard to track performance</li>
              </ol>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="https://wa.me/2349137425552?text=Hi%20MyCrib.ng%2C%20I%20want%20to%20list%20my%20property." target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gradient-primary text-primary-foreground w-full sm:w-auto gap-2">
                <MessageSquare className="h-5 w-5" /> Contact via WhatsApp
              </Button>
            </a>
            <a href="tel:+2349137425552">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                <Phone className="h-5 w-5" /> Call Us
              </Button>
            </a>
          </div>

          <div className="mt-8">
            <Link to="/properties" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              Browse existing properties <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
