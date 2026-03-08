import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find bookings for tomorrow that are still confirmed
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Get slots for tomorrow
    const { data: slots } = await supabase
      .from("inspection_slots")
      .select("id, slot_date, slot_time, property_id, properties(property_name, address)")
      .eq("slot_date", tomorrowStr);

    if (!slots || slots.length === 0) {
      return new Response(JSON.stringify({ message: "No inspections tomorrow" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const slotIds = slots.map((s: any) => s.id);

    // Get confirmed bookings for these slots
    const { data: bookings } = await supabase
      .from("inspection_bookings")
      .select("id, user_id, slot_id")
      .in("slot_id", slotIds)
      .eq("status", "confirmed");

    if (!bookings || bookings.length === 0) {
      return new Response(JSON.stringify({ message: "No confirmed bookings for tomorrow" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const slotMap = new Map(slots.map((s: any) => [s.id, s]));
    let sent = 0;

    for (const booking of bookings) {
      const slot = slotMap.get(booking.slot_id) as any;
      if (!slot) continue;

      const propertyName = slot.properties?.property_name || "a property";
      const address = slot.properties?.address || "";

      await supabase.from("notifications").insert({
        user_id: booking.user_id,
        title: "Inspection Reminder",
        message: `Reminder: Your inspection for "${propertyName}" at ${address} is tomorrow at ${slot.slot_time?.slice(0, 5)}. Don't forget!`,
        type: "info",
        link: `/property/${slot.property_id}`,
      });
      sent++;
    }

    return new Response(JSON.stringify({ message: `Sent ${sent} reminders` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
