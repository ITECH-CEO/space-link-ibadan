import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Paystack not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { reference } = await req.json();
    if (!reference) {
      return new Response(JSON.stringify({ error: "Reference is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (!data.status || data.data.status !== "success") {
      return new Response(JSON.stringify({ error: "Payment not verified", details: data }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const metadata = data.data.metadata || {};
    
    // Handle different payment types
    if (metadata.payment_type === "inspection" && metadata.booking_id) {
      await supabase
        .from("inspection_bookings")
        .update({ payment_status: "paid", payment_reference: reference })
        .eq("id", metadata.booking_id);
      console.log("Inspection payment verified for booking:", metadata.booking_id);
    } else if (metadata.payment_type === "roommate_matching" && metadata.roommate_match_id) {
      await supabase
        .from("roommate_matches")
        .update({ payment_status: "paid", payment_reference: reference })
        .eq("id", metadata.roommate_match_id);
      console.log("Roommate matching payment verified for match:", metadata.roommate_match_id);
    } else if (metadata.commission_id) {
      // Legacy: commission-based payments
      await supabase
        .from("commissions")
        .update({ status: "paid", notes: `Paystack ref: ${reference}` })
        .eq("id", metadata.commission_id);
      console.log("Commission payment verified:", metadata.commission_id);
    }

    return new Response(JSON.stringify({
      verified: true,
      amount: data.data.amount / 100,
      email: data.data.customer.email,
      reference: data.data.reference,
      payment_type: metadata.payment_type || "commission",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
