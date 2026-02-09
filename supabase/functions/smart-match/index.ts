import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Client {
  id: string;
  full_name: string;
  budget_min: number | null;
  budget_max: number | null;
  preferences: string[] | null;
  verification_status: string;
  phone: string | null;
}

interface RoomType {
  id: string;
  property_id: string;
  name: string;
  price: number;
  features: string[] | null;
  available_count: number | null;
}

interface Property {
  id: string;
  property_name: string;
  property_type: string;
  verification_status: string;
  available_rooms: number | null;
  facilities: string[] | null;
  room_types?: RoomType[];
}

function computeScore(client: Client, property: Property, roomType?: RoomType): number {
  let score = 0;
  const price = roomType?.price ?? 0;
  const budgetMin = client.budget_min ?? 0;
  const budgetMax = client.budget_max ?? Infinity;

  // Budget fit (0-40 points)
  if (price > 0 && budgetMax < Infinity) {
    if (price >= budgetMin && price <= budgetMax) {
      // Perfect fit — closer to midpoint = higher score
      const mid = (budgetMin + budgetMax) / 2;
      const dist = Math.abs(price - mid) / (budgetMax - budgetMin || 1);
      score += Math.round(40 * (1 - dist));
    } else if (price < budgetMin) {
      score += Math.max(0, 20 - Math.round(((budgetMin - price) / budgetMin) * 20));
    }
    // Over budget = 0
  } else {
    score += 20; // neutral when no budget info
  }

  // Preference/tag overlap (0-40 points)
  const clientTags = client.preferences ?? [];
  const propertyTags = [
    ...(property.facilities ?? []),
    ...(roomType?.features ?? []),
  ];
  if (clientTags.length > 0 && propertyTags.length > 0) {
    const clientSet = new Set(clientTags.map((t) => t.toLowerCase()));
    const matches = propertyTags.filter((t) => clientSet.has(t.toLowerCase())).length;
    score += Math.round((matches / clientTags.length) * 40);
  } else {
    score += 15; // neutral
  }

  // Verification bonus (0-20 points)
  if (client.verification_status === "approved") score += 10;
  if (property.verification_status === "approved") score += 10;

  return Math.min(100, score);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get auth header to validate admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const clientId = body.client_id; // optional: match specific client only

    // Fetch approved clients (or specific one)
    let clientQuery = supabase
      .from("clients")
      .select("id, full_name, budget_min, budget_max, preferences, verification_status, phone")
      .eq("verification_status", "approved");

    if (clientId) {
      clientQuery = supabase
        .from("clients")
        .select("id, full_name, budget_min, budget_max, preferences, verification_status, phone")
        .eq("id", clientId);
    }

    const { data: clients } = await clientQuery;

    // Fetch approved properties with room types
    const { data: properties } = await supabase
      .from("properties")
      .select("id, property_name, property_type, verification_status, available_rooms, facilities")
      .eq("verification_status", "approved")
      .gt("available_rooms", 0);

    const { data: roomTypes } = await supabase
      .from("room_types")
      .select("*")
      .gt("available_count", 0);

    if (!clients?.length || !properties?.length) {
      return new Response(
        JSON.stringify({ matches: [], message: "No approved clients or properties with availability." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map room types to properties
    const propMap = new Map<string, Property>();
    for (const p of properties) {
      propMap.set(p.id, { ...p, room_types: [] });
    }
    for (const rt of roomTypes || []) {
      const prop = propMap.get(rt.property_id);
      if (prop) prop.room_types!.push(rt);
    }

    // Get existing matches to avoid duplicates
    const { data: existingMatches } = await supabase
      .from("matches")
      .select("client_id, property_id, room_type_id");

    const existingSet = new Set(
      (existingMatches || []).map((m) => `${m.client_id}-${m.property_id}-${m.room_type_id || "none"}`)
    );

    // Generate matches
    const newMatches: Array<{
      client_id: string;
      property_id: string;
      room_type_id: string | null;
      compatibility_score: number;
      status: string;
    }> = [];

    for (const client of clients) {
      for (const [, property] of propMap) {
        if (property.room_types && property.room_types.length > 0) {
          for (const rt of property.room_types) {
            const key = `${client.id}-${property.id}-${rt.id}`;
            if (existingSet.has(key)) continue;
            const score = computeScore(client, property, rt);
            if (score >= 30) {
              newMatches.push({
                client_id: client.id,
                property_id: property.id,
                room_type_id: rt.id,
                compatibility_score: score,
                status: "pending",
              });
            }
          }
        } else {
          const key = `${client.id}-${property.id}-none`;
          if (existingSet.has(key)) continue;
          const score = computeScore(client, property);
          if (score >= 30) {
            newMatches.push({
              client_id: client.id,
              property_id: property.id,
              room_type_id: null,
              compatibility_score: score,
              status: "pending",
            });
          }
        }
      }
    }

    // Sort by score descending and insert top matches
    newMatches.sort((a, b) => b.compatibility_score - a.compatibility_score);
    const topMatches = newMatches.slice(0, 50); // limit batch

    if (topMatches.length > 0) {
      const { error } = await supabase.from("matches").insert(topMatches);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({
        matches_created: topMatches.length,
        top_score: topMatches[0]?.compatibility_score ?? 0,
        message: topMatches.length > 0
          ? `Generated ${topMatches.length} new matches!`
          : "No new matches found. All eligible pairs already matched.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
