import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://unispace-ng.lovable.app",
  "https://id-preview--993ca64c-be15-480a-bf68-f31267975636.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event_type, user_id, data } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user email from profile/client
    const { data: client } = await supabase
      .from("clients")
      .select("email, full_name")
      .eq("user_id", user_id)
      .maybeSingle();

    if (!client?.email) {
      return new Response(JSON.stringify({ message: "No email found for user" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let subject = "";
    let body = "";

    switch (event_type) {
      case "inspection_booked":
        subject = "Inspection Confirmed - MyCrib.ng";
        body = `Hi ${client.full_name},\n\nYour inspection has been confirmed for ${data.property_name} on ${data.date} at ${data.time}.\n\nAddress: ${data.address}\n\nPlease arrive on time. If you need to cancel, you can do so from the property page.\n\nBest regards,\nMyCrib.ng Team`;
        break;
      case "match_accepted":
        subject = "Match Accepted - MyCrib.ng";
        body = `Hi ${client.full_name},\n\nGreat news! Your match for "${data.property_name}" has been accepted.\n\nPlease log in to view details and proceed with payment.\n\nBest regards,\nMyCrib.ng Team`;
        break;
      case "payment_received":
        subject = "Payment Confirmed - MyCrib.ng";
        body = `Hi ${client.full_name},\n\nWe've received your payment of ₦${data.amount?.toLocaleString()} for "${data.property_name}".\n\nYour booking is now confirmed. Our team will reach out with next steps.\n\nBest regards,\nMyCrib.ng Team`;
        break;
      default:
        return new Response(JSON.stringify({ error: "Unknown event type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Store as a notification (email sending requires domain setup)
    await supabase.from("notifications").insert({
      user_id,
      title: subject,
      message: body.split("\n")[2] || body.slice(0, 200),
      type: "info",
    });

    return new Response(JSON.stringify({ message: "Notification sent", subject }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
