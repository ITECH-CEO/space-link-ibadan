import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Star } from "lucide-react";
import { format } from "date-fns";

interface BookingView {
  id: string;
  status: string;
  created_at: string;
  client_name: string;
  property_name: string;
  slot_date: string;
  slot_time: string;
}

interface FeedbackView {
  id: string;
  rating: number;
  comments: string | null;
  interested: boolean;
  property_name: string;
  created_at: string;
}

export function LandlordInspectionsTab() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingView[]>([]);
  const [feedback, setFeedback] = useState<FeedbackView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      // Get landlord's properties
      const { data: props } = await supabase
        .from("properties")
        .select("id, property_name")
        .eq("owner_user_id", user.id);

      if (!props || props.length === 0) { setLoading(false); return; }
      const propIds = props.map(p => p.id);
      const propMap = new Map(props.map(p => [p.id, p.property_name]));

      // Get bookings for those properties
      const { data: bookingsData } = await (supabase as any)
        .from("inspection_bookings")
        .select("id, status, created_at, client_id, property_id, slot_id")
        .in("property_id", propIds)
        .order("created_at", { ascending: false });

      if (bookingsData && bookingsData.length > 0) {
        const clientIds = [...new Set(bookingsData.map((b: any) => b.client_id))] as string[];
        const slotIds = [...new Set(bookingsData.map((b: any) => b.slot_id))] as string[];
        
        const [{ data: clients }, { data: slots }] = await Promise.all([
          supabase.from("clients").select("id, full_name").in("id", clientIds),
          (supabase as any).from("inspection_slots").select("id, slot_date, slot_time").in("id", slotIds),
        ]);
        
        const clientMap = new Map((clients || []).map(c => [c.id, c.full_name]));
        const slotMap = new Map((slots || []).map((s: any) => [s.id, s]));

        setBookings(bookingsData.map((b: any) => {
          const slot = slotMap.get(b.slot_id) as any;
          return {
            id: b.id, status: b.status, created_at: b.created_at,
            client_name: clientMap.get(b.client_id) || "Unknown",
            property_name: propMap.get(b.property_id) || "—",
            slot_date: slot?.slot_date || "—",
            slot_time: slot?.slot_time || "—",
          };
        }));
      }

      // Get feedback for landlord's properties
      const { data: fbData } = await (supabase as any)
        .from("inspection_feedback")
        .select("id, rating, comments, interested, property_id, created_at")
        .in("property_id", propIds)
        .order("created_at", { ascending: false });

      if (fbData) {
        setFeedback(fbData.map((f: any) => ({
          ...f,
          property_name: propMap.get(f.property_id) || "—",
        })));
      }

      setLoading(false);
    };
    fetch();
  }, [user]);

  const statusClass: Record<string, string> = {
    confirmed: "bg-success/10 text-success border-success/20",
    completed: "bg-primary/10 text-primary border-primary/20",
    no_show: "bg-warning/10 text-warning border-warning/20",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const avgRating = feedback.length > 0
    ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)
    : "—";

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Total Bookings</p>
            <p className="text-3xl font-bold">{bookings.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Avg Rating</p>
            <p className="text-3xl font-bold flex items-center justify-center gap-1">
              <Star className="h-5 w-5 fill-warning text-warning" /> {avgRating}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Interested Clients</p>
            <p className="text-3xl font-bold">{feedback.filter(f => f.interested).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Inspection Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground">No inspection bookings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.client_name}</TableCell>
                      <TableCell>{b.property_name}</TableCell>
                      <TableCell>{b.slot_date}</TableCell>
                      <TableCell>{b.slot_time?.slice(0, 5)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`capitalize ${statusClass[b.status] || ""}`}>
                          {b.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback */}
      {feedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5" /> Inspection Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {feedback.map(f => (
                <div key={f.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{f.property_name}</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`h-3 w-3 ${s <= f.rating ? "fill-warning text-warning" : "text-muted-foreground/20"}`} />
                      ))}
                    </div>
                  </div>
                  {f.comments && <p className="text-sm text-muted-foreground">{f.comments}</p>}
                  <div className="flex items-center justify-between mt-2">
                    {f.interested && <Badge variant="outline" className="bg-success/10 text-success text-xs">Interested in renting</Badge>}
                    <span className="text-xs text-muted-foreground ml-auto">{format(new Date(f.created_at), "PP")}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
