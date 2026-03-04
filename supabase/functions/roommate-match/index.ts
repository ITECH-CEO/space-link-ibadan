import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Client {
  id: string;
  full_name: string;
  budget_min: number | null;
  budget_max: number | null;
  preferences: string[] | null;
  verification_status: string;
}

function computeBaseScore(a: Client, b: Client): number {
  let score = 0;

  // Budget overlap (0-40 points)
  const aMin = a.budget_min ?? 0, aMax = a.budget_max ?? Infinity;
  const bMin = b.budget_min ?? 0, bMax = b.budget_max ?? Infinity;
  const overlapStart = Math.max(aMin, bMin);
  const overlapEnd = Math.min(aMax, bMax);
  if (overlapEnd >= overlapStart) {
    const overlapRange = overlapEnd - overlapStart;
    const totalRange = Math.max(aMax, bMax) - Math.min(aMin, bMin) || 1;
    score += Math.round(40 * Math.min(1, overlapRange / totalRange));
  }

  // Preference overlap (0-40 points)
  const aTags = a.preferences ?? [];
  const bTags = b.preferences ?? [];
  if (aTags.length > 0 && bTags.length > 0) {
    const setA = new Set(aTags.map(t => t.toLowerCase()));
    const matches = bTags.filter(t => setA.has(t.toLowerCase())).length;
    const total = new Set([...aTags, ...bTags]).size;
    score += Math.round(40 * (matches / total));
  } else {
    score += 10;
  }

  // Verification bonus (0-20 points)
  if (a.verification_status === "approved") score += 10;
  if (b.verification_status === "approved") score += 10;

  return Math.min(100, score);
}

async function getAIReasoning(
  a: Client,
  b: Client,
  baseScore: number,
  apiKey: string
): Promise<{ score: number; reasoning: string }> {
  try {
    const prompt = `You are a student housing roommate compatibility analyst. Given two potential roommates, provide a compatibility assessment.

Client A: "${a.full_name}" - Budget: ₦${a.budget_min ?? '?'}-₦${a.budget_max ?? '?'}, Preferences: ${(a.preferences ?? []).join(', ') || 'none listed'}
Client B: "${b.full_name}" - Budget: ₦${b.budget_min ?? '?'}-₦${b.budget_max ?? '?'}, Preferences: ${(b.preferences ?? []).join(', ') || 'none listed'}
Algorithm base score: ${baseScore}%

Respond with ONLY valid JSON (no markdown): {"score": <adjusted 0-100>, "reasoning": "<2-3 sentence explanation>"}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      console.error("AI gateway error:", res.status);
      return { score: baseScore, reasoning: "Algorithm-based score" };
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(text);
    return {
      score: Math.min(100, Math.max(0, parsed.score ?? baseScore)),
      reasoning: parsed.reasoning ?? "AI analysis complete",
    };
  } catch (err) {
    console.error("AI reasoning error:", err);
    return { score: baseScore, reasoning: "Algorithm-based score (AI unavailable)" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const targetClientId = body.client_id;

    // Fetch approved clients
    let clientQuery = supabase
      .from("clients")
      .select("id, full_name, budget_min, budget_max, preferences, verification_status")
      .eq("verification_status", "approved");

    const { data: allClients } = await clientQuery;
    if (!allClients || allClients.length < 2) {
      return new Response(
        JSON.stringify({ matches_created: 0, message: "Need at least 2 approved clients for roommate matching." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get existing roommate matches to avoid duplicates
    const { data: existing } = await supabase
      .from("roommate_matches")
      .select("client_a_id, client_b_id");
    const existingSet = new Set(
      (existing || []).map(m => [m.client_a_id, m.client_b_id].sort().join("-"))
    );

    // Check for shared property interest
    const { data: propertyMatches } = await supabase
      .from("matches")
      .select("client_id, property_id, room_type_id")
      .in("status", ["pending", "accepted"]);

    const clientPropertyMap = new Map<string, Array<{ property_id: string; room_type_id: string | null }>>();
    for (const pm of propertyMatches || []) {
      if (!clientPropertyMap.has(pm.client_id)) clientPropertyMap.set(pm.client_id, []);
      clientPropertyMap.get(pm.client_id)!.push({ property_id: pm.property_id, room_type_id: pm.room_type_id });
    }

    // Generate candidate pairs
    const candidates: Array<{
      a: Client; b: Client;
      shared_property_id: string | null;
      shared_room_type_id: string | null;
    }> = [];

    const clients = targetClientId
      ? allClients.filter(c => c.id === targetClientId)
      : allClients;

    for (const clientA of clients) {
      for (const clientB of allClients) {
        if (clientA.id >= clientB.id) continue; // avoid duplicates & self-match
        const key = [clientA.id, clientB.id].sort().join("-");
        if (existingSet.has(key)) continue;

        // Check shared property interest
        const aProps = clientPropertyMap.get(clientA.id) || [];
        const bProps = clientPropertyMap.get(clientB.id) || [];
        let sharedProp: string | null = null;
        let sharedRoom: string | null = null;
        for (const ap of aProps) {
          const match = bProps.find(bp => bp.property_id === ap.property_id);
          if (match) {
            sharedProp = ap.property_id;
            sharedRoom = ap.room_type_id || match.room_type_id;
            break;
          }
        }

        candidates.push({ a: clientA, b: clientB, shared_property_id: sharedProp, shared_room_type_id: sharedRoom });
      }
    }

    // Score and filter - use AI for top candidates
    const scored = candidates.map(c => ({
      ...c,
      baseScore: computeBaseScore(c.a, c.b) + (c.shared_property_id ? 15 : 0),
    }));
    scored.sort((a, b) => b.baseScore - a.baseScore);
    const topCandidates = scored.filter(c => c.baseScore >= 25).slice(0, 20);

    // AI-enhance top 10
    const newMatches: Array<{
      client_a_id: string; client_b_id: string;
      property_id: string | null; room_type_id: string | null;
      compatibility_score: number; ai_reasoning: string; status: string;
    }> = [];

    for (const c of topCandidates) {
      const useAI = newMatches.length < 10 && lovableKey;
      let score = c.baseScore;
      let reasoning = "Algorithm-based compatibility score";

      if (useAI) {
        const ai = await getAIReasoning(c.a, c.b, c.baseScore, lovableKey);
        score = ai.score;
        reasoning = ai.reasoning;
      }

      if (c.shared_property_id) {
        reasoning += " Both interested in the same property.";
      }

      newMatches.push({
        client_a_id: c.a.id,
        client_b_id: c.b.id,
        property_id: c.shared_property_id,
        room_type_id: c.shared_room_type_id,
        compatibility_score: Math.min(100, score),
        ai_reasoning: reasoning,
        status: "pending",
      });
    }

    if (newMatches.length > 0) {
      const { error } = await supabase.from("roommate_matches").insert(newMatches);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({
        matches_created: newMatches.length,
        message: newMatches.length > 0
          ? `Generated ${newMatches.length} roommate matches!`
          : "No new roommate matches found.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("roommate-match error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
