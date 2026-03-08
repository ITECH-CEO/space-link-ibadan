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
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { MapPin, Users, Phone, Mail, ArrowLeft, DollarSign, Building2, CalendarDays, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

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

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, userRole } = useAuth();
  const [property, setProperty] = useState<PropertyWithRooms | null>(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<InspectionSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

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

    // Fetch available slots
    (supabase as any)
      .from("inspection_slots")
      .select("*")
      .eq("property_id", id)
      .gte("slot_date", new Date().toISOString().split("T")[0])
      .order("slot_date", { ascending: true })
      .order("slot_time", { ascending: true })
      .then(({ data }: any) => setSlots(data || []));

    // Check if user already booked
    if (user) {
      (supabase as any)
        .from("inspection_bookings")
        .select("id")
        .eq("property_id", id)
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }: any) => { if (data) setBooked(true); });
    }
  }, [id, user]);

  const availableDates = [...new Set(slots.map((s) => s.slot_date))];
  const slotsForDate = selectedDate
    ? slots.filter((s) => s.slot_date === format(selectedDate, "yyyy-MM-dd") && s.current_bookings < s.max_bookings)
    : [];

  const bookSlot = async (slot: InspectionSlot) => {
    if (!user) { toast.error("Please sign in first"); return; }
    setBooking(true);

    // Get client record
    const { data: client } = await (supabase as any)
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!client) {
      toast.error("Please complete your profile first");
      setBooking(false);
      return;
    }

    const { error } = await (supabase as any).from("inspection_bookings").insert({
      slot_id: slot.id,
      property_id: id,
      client_id: client.id,
      user_id: user.id,
    });

    if (error) {
      toast.error(error.message || "Booking failed");
    } else {
      toast.success("Inspection booked! You'll receive a confirmation notification.");
      setBooked(true);
      setDialogOpen(false);
    }
    setBooking(false);
  };

  const isDayAvailable = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return availableDates.includes(dateStr);
  };

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
        <Link to="/properties" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Properties
        </Link>

        {/* Header */}
        <div className="gradient-primary rounded-xl p-6 mb-6">
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
            </div>
          </div>
        </div>

        {/* Photos */}
        {property.photos && property.photos.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display text-lg font-semibold mb-3">Photos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {property.photos.map((url, i) => (
                <img key={i} src={url} alt={`${property.property_name} photo ${i + 1}`} className="rounded-lg object-cover aspect-video w-full" />
              ))}
            </div>
          </div>
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
                  <span className="text-muted-foreground text-sm">Facilities</span>
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
                {booked ? (
                  <div className="text-center py-4">
                    <CheckCircle className="mx-auto h-10 w-10 text-success mb-2" />
                    <p className="font-semibold text-success">Inspection Booked!</p>
                    <p className="text-sm text-muted-foreground mt-1">Check your notifications for details.</p>
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
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Pick an Inspection Date & Time</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => !isDayAvailable(date)}
                          className={cn("p-3 pointer-events-auto rounded-md border mx-auto")}
                        />
                        {selectedDate && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">
                              Available times for {format(selectedDate, "PPP")}:
                            </h4>
                            {slotsForDate.length === 0 ? (
                              <p className="text-sm text-muted-foreground">All slots are full for this date.</p>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                {slotsForDate.map((slot) => (
                                  <Button
                                    key={slot.id}
                                    variant="outline"
                                    onClick={() => bookSlot(slot)}
                                    disabled={booking}
                                    className="flex items-center gap-2"
                                  >
                                    <Clock className="h-3 w-3" />
                                    {slot.slot_time.slice(0, 5)}
                                    <span className="text-xs text-muted-foreground">
                                      ({slot.max_bookings - slot.current_bookings} left)
                                    </span>
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
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
                        <DollarSign className="h-4 w-4" />₦{rt.price.toLocaleString()}
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
      </main>
    </div>
  );
}
