import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, Mail, HelpCircle, Building2, Users, CalendarDays, Shield, CreditCard, Home, Search, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const faqs = [
  {
    category: "Getting Started",
    icon: Home,
    questions: [
      {
        q: "How do I find accommodation on MyCrib.ng?",
        a: "Simply browse our Properties page, use filters to narrow down by type, price, and facilities, then book an inspection for any property you like. Our team will verify your profile and match you with the best options."
      },
      {
        q: "Do I need to create an account?",
        a: "Yes, you'll need to sign up and complete your profile with basic details. This helps us verify your identity and match you with suitable properties."
      },
      {
        q: "Is MyCrib.ng free to use?",
        a: "Browsing properties is free. There's a small inspection booking fee, and a service commission is charged only when you're successfully matched and accept a property."
      },
    ],
  },
  {
    category: "Verification",
    icon: Shield,
    questions: [
      {
        q: "What documents do I need for verification?",
        a: "You'll need a valid government-issued ID (National ID, International Passport, or Driver's License), proof of admission or employment, a current photo, and guarantor details."
      },
      {
        q: "How long does verification take?",
        a: "Verification typically takes 24–48 hours after submitting all required documents. You'll receive a notification once your profile is approved."
      },
      {
        q: "What if my verification is rejected?",
        a: "You'll receive a notification explaining what needs to be updated. Simply re-upload the correct documents and resubmit for review."
      },
    ],
  },
  {
    category: "Inspections",
    icon: CalendarDays,
    questions: [
      {
        q: "How do I book an inspection?",
        a: "Go to any property detail page, click 'Book Inspection', choose an available date/time slot, and confirm. You'll receive a confirmation notification and can also confirm via WhatsApp."
      },
      {
        q: "Can I cancel an inspection?",
        a: "Yes, you can cancel from the property detail page. Cancelled slots become available for others. We recommend cancelling at least 24 hours in advance."
      },
      {
        q: "What happens after the inspection?",
        a: "After your inspection, you'll be asked to rate the property and indicate your interest. If you're interested, our team will proceed with the matching process."
      },
    ],
  },
  {
    category: "Payments",
    icon: CreditCard,
    questions: [
      {
        q: "What are the fees involved?",
        a: "Fees include the inspection booking fee and a service commission charged upon successful placement. All fees are transparently listed on the platform."
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept bank transfers and card payments through Paystack. All transactions are secure and encrypted."
      },
      {
        q: "Can I get a refund?",
        a: "Inspection fees are non-refundable if the inspection is attended. If the property doesn't match what was advertised, contact our support team for resolution."
      },
    ],
  },
  {
    category: "Property Matching",
    icon: Users,
    questions: [
      {
        q: "How does the matching system work?",
        a: "Our AI-powered system considers your budget, location preferences, room type preferences, and other criteria to match you with the most suitable properties and potential roommates."
      },
      {
        q: "Can I request a specific roommate?",
        a: "While we primarily use our matching algorithm, you can indicate roommate preferences during onboarding. Contact support if you have a specific person in mind."
      },
      {
        q: "What if I don't like my match?",
        a: "You can decline a match from your My Matches page. Our team will work to find you a better option."
      },
    ],
  },
  {
    category: "Landlords",
    icon: Building2,
    questions: [
      {
        q: "How do I list my property on MyCrib.ng?",
        a: "Property listings are managed by MyCrib.ng admins to ensure quality. Contact us via WhatsApp or email and our team will visit, verify, and list your property."
      },
      {
        q: "How do I track my property performance?",
        a: "Once your property is listed and linked to your account, you'll have access to the Landlord Dashboard showing occupancy rates, inspection bookings, payments, and tenant complaints."
      },
      {
        q: "How do I report a maintenance issue?",
        a: "Use the 'Complaints' tab in your Landlord Dashboard to log maintenance requests. Our team will coordinate with you to resolve issues promptly."
      },
    ],
  },
];

export default function Support() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-4xl py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4 mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
            How Can We Help?
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Find answers to common questions or reach out to our friendly support team
          </p>
        </motion.div>

        {/* Contact Cards */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 sm:grid-cols-3 mb-10"
        >
          <a href="https://wa.me/2349137425552" target="_blank" rel="noopener noreferrer">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-success/20 hover:border-success/40">
              <CardContent className="pt-6 text-center">
                <div className="inline-flex items-center justify-center rounded-full bg-success/10 p-3 mb-3">
                  <MessageSquare className="h-6 w-6 text-success" />
                </div>
                <h3 className="font-semibold mb-1">WhatsApp</h3>
                <p className="text-sm text-muted-foreground mb-2">Chat with us instantly</p>
                <Badge className="bg-success/10 text-success">+234 913 742 5552</Badge>
              </CardContent>
            </Card>
          </a>
          <a href="tel:+2349137425552">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-primary/20 hover:border-primary/40">
              <CardContent className="pt-6 text-center">
                <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-3">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Call Us</h3>
                <p className="text-sm text-muted-foreground mb-2">Mon – Sat, 8am – 8pm</p>
                <Badge variant="outline" className="border-primary/20 text-primary">+234 913 742 5552</Badge>
              </CardContent>
            </Card>
          </a>
          <a href="mailto:support@mycrib.ng">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-accent/20 hover:border-accent/40">
              <CardContent className="pt-6 text-center">
                <div className="inline-flex items-center justify-center rounded-full bg-accent/10 p-3 mb-3">
                  <Mail className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="font-semibold mb-1">Email</h3>
                <p className="text-sm text-muted-foreground mb-2">We reply within 24hrs</p>
                <Badge variant="outline" className="border-accent/20">support@mycrib.ng</Badge>
              </CardContent>
            </Card>
          </a>
        </motion.div>

        {/* FAQ Sections */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="font-display text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((section, sIdx) => (
              <motion.div
                key={section.category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + sIdx * 0.05 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <section.icon className="h-5 w-5 text-primary" />
                      {section.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {section.questions.map((item, qIdx) => (
                        <AccordionItem key={qIdx} value={`${sIdx}-${qIdx}`}>
                          <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                            {item.q}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                            {item.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 text-center"
        >
          <Card className="gradient-primary text-primary-foreground">
            <CardContent className="py-8">
              <h3 className="font-display text-xl font-bold mb-2">Still have questions?</h3>
              <p className="text-primary-foreground/80 mb-4 text-sm">
                Our support team is always happy to help. Reach out anytime!
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a href="https://wa.me/2349137425552" target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="sm" className="gap-2">
                    <MessageSquare className="h-4 w-4" /> Chat on WhatsApp
                  </Button>
                </a>
                <Link to="/properties">
                  <Button variant="secondary" size="sm" className="gap-2">
                    <Search className="h-4 w-4" /> Browse Properties <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
