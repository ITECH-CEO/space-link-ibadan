import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date().toISOString().split("T")[0];
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Find overdue payments
    const { data: overdue } = await supabase
      .from("rent_payments")
      .select("*, properties(property_name, owner_user_id)")
      .eq("status", "pending")
      .lt("due_date", today);

    // Mark overdue
    if (overdue && overdue.length > 0) {
      const overdueIds = overdue.map((p: any) => p.id);
      await supabase
        .from("rent_payments")
        .update({ status: "overdue" })
        .in("id", overdueIds);

      // Notify landlords about overdue payments
      const notifications: any[] = [];
      const notifiedLandlords = new Set<string>();

      for (const payment of overdue) {
        const ownerId = (payment as any).properties?.owner_user_id;
        const propName = (payment as any).properties?.property_name;
        if (ownerId && !notifiedLandlords.has(ownerId + payment.id)) {
          notifiedLandlords.add(ownerId + payment.id);
          notifications.push({
            user_id: ownerId,
            title: "Overdue Rent Payment",
            message: `Rent payment of ₦${payment.amount.toLocaleString()} from ${payment.tenant_name} for "${propName}" is overdue (due: ${payment.due_date}).`,
            type: "warning",
            link: "/landlord",
          });
        }
      }

      if (notifications.length > 0) {
        await supabase.from("notifications").insert(notifications);
      }
    }

    // Find upcoming payments (due in 3 days)
    const { data: upcoming } = await supabase
      .from("rent_payments")
      .select("*, properties(property_name, owner_user_id)")
      .eq("status", "pending")
      .gte("due_date", today)
      .lte("due_date", threeDaysFromNow);

    if (upcoming && upcoming.length > 0) {
      const notifications: any[] = [];
      for (const payment of upcoming) {
        const ownerId = (payment as any).properties?.owner_user_id;
        const propName = (payment as any).properties?.property_name;
        if (ownerId) {
          notifications.push({
            user_id: ownerId,
            title: "Upcoming Rent Payment",
            message: `Rent of ₦${payment.amount.toLocaleString()} from ${payment.tenant_name} for "${propName}" is due on ${payment.due_date}.`,
            type: "info",
            link: "/landlord",
          });
        }
      }

      if (notifications.length > 0) {
        await supabase.from("notifications").insert(notifications);
      }
    }

    return new Response(
      JSON.stringify({
        overdue_marked: overdue?.length || 0,
        upcoming_reminded: upcoming?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
