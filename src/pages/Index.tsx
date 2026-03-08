import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, Shield, Handshake, ArrowRight, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import mycribLogo from "@/assets/mycrib-logo.png";

const features = [
  { icon: Users, title: "Student Registration", desc: "Quick onboarding with ID verification, guarantor info, and preference tags." },
  { icon: Building2, title: "Property Listings", desc: "Hostels, apartments, and shared rooms with detailed facility info." },
  { icon: Handshake, title: "Smart Matching", desc: "AI-powered matching based on budget, preferences, and compatibility." },
  { icon: Shield, title: "Verified & Secure", desc: "Multi-level verification for students and properties. Admin dashboard for oversight." },
];

export default function Index() {
  const [stats, setStats] = useState({ properties: 0, clients: 0, matches: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: pCount }, { count: cCount }, { count: mCount }] = await Promise.all([
        supabase.from("properties").select("*", { count: "exact", head: true }).eq("verification_status", "approved"),
        supabase.from("clients").select("*", { count: "exact", head: true }),
        supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "accepted"),
      ]);
      setStats({ properties: pCount ?? 0, clients: cCount ?? 0, matches: mCount ?? 0 });
    };
    fetchStats();
  }, []);

  const displayStats = [
    { value: stats.properties > 0 ? `${stats.properties}+` : "—", label: "Verified Properties" },
    { value: stats.clients > 0 ? `${stats.clients}+` : "—", label: "Registered Students" },
    { value: stats.matches > 0 ? `${stats.matches}+` : "—", label: "Successful Matches" },
    { value: "24/7", label: "Support Available" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero py-20 md:py-32">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, hsl(224 76% 48% / 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, hsl(25 95% 53% / 0.2) 0%, transparent 50%)" }} />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <img src={mycribLogo} alt="MyCrib.ng" className="mx-auto mb-6 h-20 w-20 rounded-2xl object-contain" />
            <h1 className="mb-4 font-display text-4xl font-bold leading-tight text-primary-foreground md:text-6xl">
              Find Your Perfect <span className="text-accent">Crib</span> in Nigeria
            </h1>
            <p className="mb-8 text-lg text-primary-foreground/80 md:text-xl">
              Verified. Secure. Connected. Browse verified hostels, apartments, and find compatible roommates.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="gradient-accent text-accent-foreground font-semibold px-8 text-lg">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/properties">
                <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 px-8 text-lg">
                  Browse Properties
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b bg-card py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {displayStats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="font-display text-3xl font-bold text-primary md:text-4xl">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
         <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 font-display text-3xl font-bold">How MyCrib Works</h2>
            <p className="text-muted-foreground">From registration to moving in — we handle everything.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-0 bg-muted/50 transition-shadow hover:shadow-lg">
                  <CardContent className="pt-6">
                    <div className="mb-4 inline-flex rounded-xl gradient-primary p-3">
                      <f.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="mb-2 font-display text-lg font-semibold">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
       <section className="gradient-primary py-16">
        <div className="container text-center">
          <h2 className="mb-4 font-display text-3xl font-bold text-primary-foreground">Ready to Find Your Crib?</h2>
          <p className="mb-8 text-primary-foreground/80">Join thousands who found their perfect accommodation through MyCrib.ng.</p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="gradient-accent text-accent-foreground font-semibold px-8">
              Sign Up Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
       <footer className="border-t bg-card py-8">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src={mycribLogo} alt="MyCrib.ng" className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-display font-bold">MyCrib.ng</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} MyCrib.ng — Verified. Secure. Connected.
          </p>
           <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" /> Nigeria
          </div>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  );
}
