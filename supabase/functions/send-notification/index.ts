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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { type, user_id, data } = await req.json();

    // Get user's profile for their name
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("user_id", user_id)
      .single();

    const userName = profile?.full_name || "User";

    // Create in-app notification based on type
    let notification = { title: "", message: "", notifType: "info", link: "" };

    switch (type) {
      case "verification_approved":
        notification = {
          title: "Verification Approved ✅",
          message: `Congratulations ${userName}! Your profile has been verified. You can now book inspections and get matched with properties.`,
          notifType: "success",
          link: "/properties",
        };
        break;
      case "verification_rejected":
        notification = {
          title: "Verification Update",
          message: `Hi ${userName}, your verification needs attention. Please update your documents and try again.`,
          notifType: "error",
          link: "/profile",
        };
        break;
      case "match_created":
        notification = {
          title: "New Property Match! 🏠",
          message: `Great news ${userName}! You've been matched with "${data?.property_name || "a property"}". Check your matches for details.`,
          notifType: "success",
          link: "/my-matches",
        };
        break;
      case "inspection_reminder":
        notification = {
          title: "Inspection Reminder 📅",
          message: `Reminder: Your inspection for "${data?.property_name || "a property"}" is scheduled for ${data?.date || "soon"}.`,
          notifType: "info",
          link: "/my-matches",
        };
        break;
      default:
        notification = {
          title: data?.title || "Notification",
          message: data?.message || "You have a new notification.",
          notifType: "info",
          link: data?.link || "/",
        };
    }

    // Insert notification
    const { error } = await supabaseClient.from("notifications").insert({
      user_id,
      title: notification.title,
      message: notification.message,
      type: notification.notifType,
      link: notification.link,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
