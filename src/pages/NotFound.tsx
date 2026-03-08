import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center gradient-hero px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 40%, hsl(217 91% 60% / 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 60%, hsl(25 95% 53% / 0.15) 0%, transparent 50%)" }} />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center relative z-10"
      >
        <motion.h1
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 150, damping: 15 }}
          className="mb-4 font-display text-8xl font-bold text-primary-foreground"
        >
          404
        </motion.h1>
        <p className="mb-6 text-xl text-primary-foreground/80 font-medium">Oops! This page doesn't exist</p>
        <p className="mb-8 text-sm text-primary-foreground/50">The page you're looking for may have been moved or deleted.</p>
        <Link to="/">
          <Button size="lg" className="gradient-accent text-accent-foreground font-semibold px-8">
            <Home className="mr-2 h-5 w-5" /> Back to Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
