import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { CalendarDays, Clock, Check, MapPin, Building2, CreditCard, ArrowLeft, ArrowRight, Loader2, Shield } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface InspectionSlot {
  id: string;
  slot_date: string;
  slot_time: string;
  max_bookings: number;
  current_bookings: number;
}

interface InspectionBookingWizardProps {
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  propertyType: string;
  slots: InspectionSlot[];
  onBookingComplete: (bookingInfo: { id: string; status: string; slot_id: string; slot_date: string; slot_time: string }) => void;
  onClose: () => void;
}

const STEPS = [
  { label: "Pick a Slot", icon: CalendarDays },
  { label: "Review Details", icon: Building2 },
  { label: "Pay & Confirm", icon: CreditCard },
];

export function InspectionBookingWizard({
  propertyId, propertyName, propertyAddress, propertyType, slots, onBookingComplete, onClose,
}: InspectionBookingWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<InspectionSlot | null>(null);
  const [inspectionFee, setInspectionFee] = useState<number>(0);
  const [feeLoading, setFeeLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [paying, setPaying] = useState(false);

  const availableDates = [...new Set(slots.map((s) => s.slot_date))];
  const slotsForDate = selectedDate
    ? slots.filter((s) => s.slot_date === format(selectedDate, "yyyy-MM-dd") && s.current_bookings < s.max_bookings)
    : [];

  const isDayAvailable = (date: Date) => availableDates.includes(format(date, "yyyy-MM-dd"));

  // Fetch inspection fee
  useEffect(() => {
    (supabase as any)
      .from("platform_fees")
      .select("amount, is_active")
      .eq("fee_type", "inspection")
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.is_active) setInspectionFee(data.amount);
        else setInspectionFee(0);
        setFeeLoading(false);
      });
  }, []);

  const handleSlotSelect = (slot: InspectionSlot) => {
    setSelectedSlot(slot);
  };

  const proceedToReview = () => {
    if (!selectedSlot) { toast.error("Please select a time slot"); return; }
    setStep(1);
  };

  const proceedToPayment = () => setStep(2);
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const createBookingAndPay = async () => {
    if (!user || !selectedSlot) return;

    // Get client record
    const { data: client } = await (supabase as any)
      .from("clients").select("id").eq("user_id", user.id).maybeSingle();
    if (!client) {
      toast.error("Please complete your profile first");
      return;
    }

    if (inspectionFee > 0) {
      // Pay first, then book
      setPaying(true);
      try {
        const { data: payData, error: payError } = await supabase.functions.invoke("paystack-initialize", {
          body: {
            email: user.email,
            amount: inspectionFee,
            callback_url: `${window.location.origin}/property/${propertyId}?verify_inspection=true`,
            metadata: {
              payment_type: "inspection",
              property_id: propertyId,
              slot_id: selectedSlot.id,
              client_id: client.id,
              user_id: user.id,
            },
          },
        });

        if (payError || !payData?.authorization_url) {
          toast.error(payData?.error || "Payment initialization failed");
          setPaying(false);
          return;
        }

        // Store pending booking info in sessionStorage so we can complete after redirect
        sessionStorage.setItem("pending_inspection", JSON.stringify({
          slot_id: selectedSlot.id,
          property_id: propertyId,
          client_id: client.id,
          user_id: user.id,
          slot_date: selectedSlot.slot_date,
          slot_time: selectedSlot.slot_time,
          reference: payData.reference,
        }));

        window.location.href = payData.authorization_url;
      } catch (err: any) {
        toast.error(err.message || "Payment failed");
        setPaying(false);
      }
    } else {
      // Free inspection — book directly
      setBooking(true);
      const { data: bookingData, error } = await (supabase as any)
        .from("inspection_bookings")
        .insert({
          slot_id: selectedSlot.id,
          property_id: propertyId,
          client_id: client.id,
          user_id: user.id,
          payment_status: "free",
        })
        .select("id")
        .single();

      if (error) {
        toast.error(error.message || "Booking failed");
      } else {
        toast.success("Inspection booked successfully!");
        onBookingComplete({
          id: bookingData.id,
          status: "confirmed",
          slot_id: selectedSlot.id,
          slot_date: selectedSlot.slot_date,
          slot_time: selectedSlot.slot_time,
        });
      }
      setBooking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center justify-between px-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={i} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                  isDone ? "border-primary bg-primary text-primary-foreground" :
                  isActive ? "border-primary bg-primary/10 text-primary" :
                  "border-muted-foreground/20 text-muted-foreground/40"
                )}>
                  {isDone ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={cn("text-xs font-medium", isActive || isDone ? "text-foreground" : "text-muted-foreground/50")}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("mx-2 h-0.5 flex-1 rounded-full transition-colors", isDone ? "bg-primary" : "bg-muted-foreground/15")} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Pick a Slot */}
      {step === 0 && (
        <div className="space-y-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
            disabled={(date) => !isDayAvailable(date)}
            className={cn("p-3 pointer-events-auto rounded-md border mx-auto")}
          />

          {selectedDate && (
            <div>
              <h4 className="text-sm font-medium mb-2">
                Available times for {format(selectedDate, "EEEE, MMMM d")}:
              </h4>
              {slotsForDate.length === 0 ? (
                <p className="text-sm text-muted-foreground">All slots are full for this date.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {slotsForDate.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleSlotSelect(slot)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all",
                        selectedSlot?.id === slot.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Clock className="h-4 w-4" />
                      {slot.slot_time.slice(0, 5)}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {slot.max_bookings - slot.current_bookings} left
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={proceedToReview} disabled={!selectedSlot} className="gradient-primary text-primary-foreground">
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Review Details */}
      {step === 1 && selectedSlot && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">{propertyName}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {propertyAddress}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">{format(new Date(selectedSlot.slot_date), "EEEE, MMMM d, yyyy")}</p>
                  <p className="text-sm text-muted-foreground">at {selectedSlot.slot_time.slice(0, 5)}</p>
                </div>
              </div>
              <Badge variant="outline" className="capitalize">{propertyType}</Badge>
            </CardContent>
          </Card>

          {/* Fee Breakdown */}
          <Card className="border-primary/20">
            <CardContent className="pt-5">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Fee Breakdown
              </h4>
              {feeLoading ? (
                <p className="text-sm text-muted-foreground">Loading fees...</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Inspection fee</span>
                    <span className="font-medium">{inspectionFee > 0 ? `₦${inspectionFee.toLocaleString()}` : "Free"}</span>
                  </div>
                  <div className="border-t pt-2 flex items-center justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-primary text-lg">{inspectionFee > 0 ? `₦${inspectionFee.toLocaleString()}` : "Free"}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={goBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={proceedToPayment} className="gradient-primary text-primary-foreground">
              {inspectionFee > 0 ? "Proceed to Pay" : "Confirm Booking"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Pay & Confirm */}
      {step === 2 && selectedSlot && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            {inspectionFee > 0 ? (
              <>
                <h3 className="text-lg font-bold">Complete Payment</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You'll be redirected to Paystack to pay <span className="font-semibold text-foreground">₦{inspectionFee.toLocaleString()}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Your inspection will be confirmed once payment is successful.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold">Confirm Your Inspection</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  No fee required. Click below to confirm your booking.
                </p>
              </>
            )}
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Property</span>
              <span className="font-medium">{propertyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">{format(new Date(selectedSlot.slot_date), "MMM d, yyyy")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium">{selectedSlot.slot_time.slice(0, 5)}</span>
            </div>
            {inspectionFee > 0 && (
              <div className="flex justify-between border-t pt-1 mt-1">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-primary">₦{inspectionFee.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={goBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button
              onClick={createBookingAndPay}
              disabled={booking || paying}
              className="gradient-accent text-accent-foreground font-semibold min-w-[160px]"
            >
              {booking || paying ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : inspectionFee > 0 ? (
                <><CreditCard className="mr-2 h-4 w-4" /> Pay ₦{inspectionFee.toLocaleString()}</>
              ) : (
                <><Check className="mr-2 h-4 w-4" /> Confirm Booking</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
