import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/VerificationBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, Users, Phone, Mail, ArrowLeft, Banknote, Building2, CalendarDays, Clock, CheckCircle, XCircle, Star, MessageSquare, Footprints, Bus, Zap, Droplets, Navigation, Bike, Car } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";
import { InspectionBookingWizard } from "@/components/InspectionBookingWizard";
import { ImageLightbox } from "@/components/ImageLightbox";
import { PropertyReviews } from "@/components/PropertyReviews";
import { PanoramaViewer } from "@/components/PanoramaViewer";
import { SponsorsDisplay } from "@/components/SponsorsDisplay";

interface PropertyWithRooms extends Tables<"properties"> {
  room_types: Tables<"room_types">[];
}

interface InspectionSlot {
  id: string;
  slot_date: string;
  slot_time: string;
  max_bookings: number;
  current_bookings: number;
}

interface BookingInfo {
  id: string;
  status: string;
  slot_id: string;
  slot_date?: string;
  slot_time?: string;
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, userRole } = useAuth();
  const [property, setProperty] = useState<PropertyWithRooms | null>(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<InspectionSlot[]>([]);
  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Feedback state
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComments, setFeedbackComments] = useState("");
  const [feedbackInterested, setFeedbackInterested] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [hasFeedback, setHasFeedback] = useState(false);

  const isAdmin = userRole === "super_admin" || userRole === "manager" || userRole === "verifier";
  const isLandlord = userRole === "landlord";
  const showLandlordContact = isAdmin || isLandlord;

  useEffect(() => {
    if (!id) return;
    supabase
      .from("properties")
      .select("*, room_types(*)")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setProperty(data as PropertyWithRooms | null);
        setLoading(false);
      });

    (supabase as any)
      .from("inspection_slots")
      .select("*")
      .eq("property_id", id)
      .gte("slot_date", new Date().toISOString().split("T")[0])
      .order("slot_date", { ascending: true })
      .order("slot_time", { ascending: true })
      .then(({ data }: any) => setSlots(data || []));

    if (user) {
      (supabase as any)
        .from("inspection_bookings")
        .select("id, status, slot_id")
        .eq("property_id", id)
        .eq("user_id", user.id)
        .maybeSingle()
        .then(async ({ data }: any) => {
          if (data) {
            const { data: slotData } = await (supabase as any)
              .from("inspection_slots")
              .select("slot_date, slot_time")
              .eq("id", data.slot_id)
              .single();
            setBookingInfo({
              ...data,
              slot_date: slotData?.slot_date,
              slot_time: slotData?.slot_time,
            });

            const { data: fb } = await (supabase as any)
              .from("inspection_feedback")
              .select("id")
              .eq("booking_id", data.id)
              .eq("user_id", user.id)
              .maybeSingle();
            if (fb) setHasFeedback(true);
          }
        });
    }
  }, [id, user]);

  const cancelBooking = async () => {
    if (!bookingInfo) return;
    setCancelling(true);
    const { error } = await (supabase as any)
      .from("inspection_bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingInfo.id);
    if (error) {
      toast.error(error.message || "Cancellation failed");
    } else {
      toast.success("Inspection cancelled. The slot is now available for others.");
      setBookingInfo({ ...bookingInfo, status: "cancelled" });
    }
    setCancelling(false);
  };

  const submitFeedback = async () => {
    if (!user || !bookingInfo || !id) return;
    if (feedbackRating === 0) { toast.error("Please select a rating"); return; }
    setSubmittingFeedback(true);
    const { error } = await (supabase as any).from("inspection_feedback").insert({
      booking_id: bookingInfo.id,
      user_id: user.id,
      property_id: id,
      rating: feedbackRating,
      comments: feedbackComments || null,
      interested: feedbackInterested,
    });
    if (error) {
      toast.error(error.message || "Failed to submit feedback");
    } else {
      toast.success("Thank you for your feedback!");
      setHasFeedback(true);
      setFeedbackDialogOpen(false);
    }
    setSubmittingFeedback(false);
  };

  const whatsAppMessage = property && bookingInfo?.slot_date
    ? `Hi MyCrib.ng, I've booked an inspection for "${property.property_name}" at ${property.address} on ${bookingInfo.slot_date} at ${bookingInfo.slot_time?.slice(0, 5)}. Please confirm.`
    : "";

  const bookingPassed = bookingInfo?.slot_date && new Date(bookingInfo.slot_date) < new Date();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container max-w-4xl py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container max-w-4xl py-8 text-center">
          <Building2 className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Property Not Found</h1>
          <Link to="/properties"><Button variant="outline">Back to Properties</Button></Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-4xl py-8">
        <Link to="/properties" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Properties
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="gradient-primary rounded-xl p-6 mb-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-primary-foreground md:text-3xl">
                {property.property_name}
              </h1>
              <div className="mt-2 flex items-center gap-2 text-primary-foreground/80 text-sm">
                <MapPin className="h-4 w-4" /> {property.address}
              </div>
              {property.proximity_to_campus && (
                <p className="mt-1 text-sm text-primary-foreground/70">📍 {property.proximity_to_campus}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 capitalize">
                {property.property_type}
              </Badge>
              <VerificationBadge status={property.verification_status} />
              {(property as any).management_type === "listed" ? (
                <Badge variant="outline" className="bg-accent/20 text-accent-foreground border-accent/30 text-xs">📋 Listed Only</Badge>
              ) : (
                <Badge variant="outline" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 text-xs">✅ Fully Managed</Badge>
              )}
            </div>
          </div>
        </motion.div>

        {/* Photos with Lightbox */}
        {property.photos && property.photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-6"
          >
            <h2 className="font-display text-lg font-semibold mb-3">Photos</h2>
            <ImageLightbox images={property.photos} alt={property.property_name} />
          </motion.div>
        )}

        {/* Videos */}
        {property.videos && property.videos.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display text-lg font-semibold mb-3">Videos</h2>
            <div className="grid gap-3">
              {property.videos.map((url, i) => (
                <video key={i} src={url} controls className="rounded-lg w-full max-h-[400px]" />
              ))}
            </div>
          </div>
        )}

        {/* 360° Virtual Tour */}
        {(property as any).panorama_photos && (property as any).panorama_photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mb-6"
          >
            <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
              🔄 360° Virtual Tour
            </h2>
            <PanoramaViewer images={(property as any).panorama_photos} />
          </motion.div>
        )}

        {/* Location & Transport Info */}
        {(property.distance_to_campus_km || (property as any).walkability_rating || ((property as any).transport_options && (property as any).transport_options.length > 0)) && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {property.distance_to_campus_km && (
              <Card className="border-primary/20">
                <CardContent className="pt-5 pb-4 flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2.5">
                    <Navigation className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Distance to Campus</p>
                    <p className="text-lg font-bold">{property.distance_to_campus_km} km</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {(property as any).walkability_rating && (
              <Card className="border-primary/20">
                <CardContent className="pt-5 pb-4 flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2.5">
                    <Footprints className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Walkability</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn("h-4 w-4", s <= (property as any).walkability_rating ? "fill-warning text-warning" : "text-muted-foreground/20")} />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {(property as any).utility_rating?.power && (
              <Card className="border-primary/20">
                <CardContent className="pt-5 pb-4 flex items-center gap-3">
                  <div className="rounded-full bg-warning/10 p-2.5">
                    <Zap className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Power Reliability</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn("h-3.5 w-3.5", s <= (property as any).utility_rating.power ? "fill-warning text-warning" : "text-muted-foreground/20")} />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {(property as any).utility_rating?.water && (
              <Card className="border-primary/20">
                <CardContent className="pt-5 pb-4 flex items-center gap-3">
                  <div className="rounded-full bg-accent/10 p-2.5">
                    <Droplets className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Water Reliability</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn("h-3.5 w-3.5", s <= (property as any).utility_rating.water ? "fill-accent text-accent" : "text-muted-foreground/20")} />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Transport Options */}
        {(property as any).transport_options && (property as any).transport_options.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary" /> Getting to Campus
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(property as any).transport_options.map((t: any, i: number) => {
                const Icon = t.mode === 'walk' ? Footprints : t.mode === 'bike' ? Bike : t.mode === 'bus' ? Bus : Car;
                return (
                  <Card key={i}>
                    <CardContent className="pt-4 pb-3 flex items-center gap-3">
                      <div className="rounded-full bg-muted p-2">
                        <Icon className="h-4 w-4 text-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium capitalize">{t.mode}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {t.duration && <span>~{t.duration}</span>}
                          {t.cost_estimate && <span>· ₦{t.cost_estimate}</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Details */}
          <Card>
            <CardHeader><CardTitle>Property Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rooms</span>
                <span className="flex items-center gap-1 font-medium">
                  <Users className="h-4 w-4 text-primary" />
                  {property.available_rooms}/{property.total_rooms} available
                </span>
              </div>
              {property.location && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium">{property.location}</span>
                </div>
              )}
              {property.facilities && property.facilities.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-sm">Amenities</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {property.facilities.map((f) => (
                      <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {property.special_notes && (
                <div>
                  <span className="text-muted-foreground text-sm">Notes</span>
                  <p className="mt-1 text-sm">{property.special_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inspection Booking / Landlord Contact */}
          {showLandlordContact ? (
            <Card>
              <CardHeader><CardTitle>Landlord Contact</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="font-semibold text-lg">{property.landlord_name}</div>
                {property.landlord_phone && (
                  <a href={`tel:${property.landlord_phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Phone className="h-4 w-4" /> {property.landlord_phone}
                  </a>
                )}
                {property.landlord_email && (
                  <a href={`mailto:${property.landlord_email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Mail className="h-4 w-4" /> {property.landlord_email}
                  </a>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Schedule Inspection</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {bookingInfo && bookingInfo.status !== "cancelled" ? (
                  <div className="space-y-4">
                    <div className="text-center py-3">
                      <CheckCircle className="mx-auto h-10 w-10 text-success mb-2" />
                      <p className="font-semibold text-success">Inspection Booked!</p>
                      {bookingInfo.slot_date && (
                        <p className="text-sm text-muted-foreground mt-1">
                          📅 {bookingInfo.slot_date} at {bookingInfo.slot_time?.slice(0, 5)}
                        </p>
                      )}
                    </div>

                    {whatsAppMessage && (
                      <a href={`https://wa.me/2349137425552?text=${encodeURIComponent(whatsAppMessage)}`} target="_blank" rel="noopener noreferrer" className="block">
                        <Button variant="outline" className="w-full border-success/30 text-success hover:bg-success/10">
                          <MessageSquare className="mr-2 h-4 w-4" /> Confirm via WhatsApp
                        </Button>
                      </a>
                    )}

                    <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10" onClick={cancelBooking} disabled={cancelling}>
                      <XCircle className="mr-2 h-4 w-4" />
                      {cancelling ? "Cancelling..." : "Cancel Inspection"}
                    </Button>

                    {bookingPassed && !hasFeedback && (
                      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="w-full gradient-accent text-accent-foreground">
                            <Star className="mr-2 h-4 w-4" /> Rate This Property
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>How was your inspection?</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label className="mb-2 block">Rating</Label>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <button key={s} onClick={() => setFeedbackRating(s)} className="p-1">
                                    <Star className={cn("h-7 w-7 transition-colors", s <= feedbackRating ? "fill-warning text-warning" : "text-muted-foreground/30")} />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label>Comments (optional)</Label>
                              <Textarea value={feedbackComments} onChange={(e) => setFeedbackComments(e.target.value)} placeholder="Share your experience..." className="mt-1" />
                            </div>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" id="interested" checked={feedbackInterested} onChange={(e) => setFeedbackInterested(e.target.checked)} className="rounded" />
                              <Label htmlFor="interested" className="text-sm">I'm interested in renting here</Label>
                            </div>
                            <Button onClick={submitFeedback} disabled={submittingFeedback} className="w-full gradient-primary text-primary-foreground">
                              {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    {hasFeedback && (
                      <p className="text-xs text-muted-foreground text-center">✅ Feedback submitted. Thank you!</p>
                    )}
                  </div>
                ) : bookingInfo?.status === "cancelled" ? (
                  <div className="text-center py-4">
                    <XCircle className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                    <p className="font-semibold text-muted-foreground">Inspection Cancelled</p>
                    <p className="text-sm text-muted-foreground mt-1">You can book a new slot below.</p>
                    {slots.length > 0 && (
                      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="mt-3 gradient-accent text-accent-foreground font-semibold">
                            <CalendarDays className="mr-2 h-4 w-4" /> Book Again
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                          <DialogHeader><DialogTitle>Book Inspection</DialogTitle></DialogHeader>
                          <InspectionBookingWizard
                            propertyId={id!}
                            propertyName={property.property_name}
                            propertyAddress={property.address}
                            propertyType={property.property_type}
                            slots={slots}
                            onBookingComplete={(info) => { setBookingInfo(info); setDialogOpen(false); }}
                            onClose={() => setDialogOpen(false)}
                          />
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                ) : slots.length === 0 ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">
                      No inspection slots available yet. Contact MyCrib.ng for more information.
                    </p>
                    <Link to="/profile">
                      <Button className="w-full gradient-primary text-primary-foreground">
                        Complete Profile to Get Matched
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full gradient-accent text-accent-foreground font-semibold">
                        <CalendarDays className="mr-2 h-4 w-4" /> Book Inspection
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader><DialogTitle>Book Inspection</DialogTitle></DialogHeader>
                      <InspectionBookingWizard
                        propertyId={id!}
                        propertyName={property.property_name}
                        propertyAddress={property.address}
                        propertyType={property.property_type}
                        slots={slots}
                        onBookingComplete={(info) => { setBookingInfo(info); setDialogOpen(false); }}
                        onClose={() => setDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Room Types */}
        {property.room_types && property.room_types.length > 0 && (
          <div className="mt-6">
            <h2 className="font-display text-lg font-semibold mb-3">Room Types & Pricing</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {property.room_types.map((rt) => (
                <Card key={rt.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{rt.name}</h3>
                      <span className="flex items-center gap-1 text-lg font-bold text-primary">
                        ₦{rt.price.toLocaleString()}
                      </span>
                    </div>
                    {rt.description && <p className="text-sm text-muted-foreground mb-2">{rt.description}</p>}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{rt.available_count ?? 0} available</span>
                    </div>
                    {rt.features && rt.features.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {rt.features.map((f) => (
                          <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <PropertyReviews propertyId={id!} />

        {/* Sponsors for this property */}
        <SponsorsDisplay propertyId={id} />
      </main>
    </div>
  );
}
