import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

const campuses = [
  { name: "UNILAG", location: "Lagos", keyword: "unilag" },
  { name: "UI", location: "Ibadan", keyword: "ibadan" },
  { name: "UNIBEN", location: "Benin", keyword: "benin" },
  { name: "OAU", location: "Ile-Ife", keyword: "ife" },
  { name: "FUTA", location: "Akure", keyword: "akure" },
  { name: "UNIPORT", location: "Port Harcourt", keyword: "port harcourt" },
];

const colors = [
  "from-primary to-primary/80",
  "from-accent to-accent/80",
  "from-success to-success/80",
  "from-warning to-warning/80",
  "from-primary to-accent/80",
  "from-destructive to-destructive/80",
];

export function CampusCards() {
  return (
    <section className="py-16">
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="mb-3 font-display text-3xl font-bold">Find Accommodation by Campus</h2>
          <p className="text-muted-foreground">Browse verified properties near Nigerian universities</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {campuses.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
            >
              <Link
                to={`/properties?search=${encodeURIComponent(c.keyword)}`}
                className={`block rounded-xl bg-gradient-to-br ${colors[i]} p-5 text-center text-primary-foreground transition-transform hover:scale-105 shadow-lg`}
              >
                <MapPin className="mx-auto mb-2 h-6 w-6" />
                <div className="font-display font-bold text-lg">{c.name}</div>
                <div className="text-xs opacity-80">{c.location}</div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
