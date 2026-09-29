import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return jsonResponse({ error: "Business management is not configured." }, 503);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return jsonResponse({ error: "Authentication required." }, 401);
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authResult, error: authError } = await adminClient.auth.getUser(authorization.slice(7));
  if (authError || !authResult.user) return jsonResponse({ error: "Invalid session." }, 401);

  const { data: actor } = await adminClient.from("profiles")
    .select("id, name, email, role, status")
    .eq("user_id", authResult.user.id)
    .maybeSingle();
  if (actor?.role !== "admin" || actor.status !== "active") return jsonResponse({ error: "Administrator access required." }, 403);

  try {
    const body = await req.json();
    if (typeof body.businessId !== "string" || !["active", "disabled"].includes(body.status)) {
      return jsonResponse({ error: "Invalid business status request." }, 400);
    }

    const { data: business, error: updateError } = await adminClient.from("businesses")
      .update({ status: body.status })
      .eq("id", body.businessId)
      .select("*")
      .single();
    if (updateError || !business) return jsonResponse({ error: updateError?.message || "Business not found." }, 404);

    const { error: auditError } = await adminClient.from("audit_logs").insert({
      actor_user_id: authResult.user.id,
      actor_name: actor.name,
      actor_email: actor.email,
      action: body.status === "disabled" ? "DISABLE_BUSINESS" : "ENABLE_BUSINESS",
      entity_type: "business",
      entity_id: business.id,
      metadata: { name: business.name, status: body.status },
    });
    if (auditError) console.error("Could not record business status audit:", auditError.message);

    return jsonResponse({ business });
  } catch (error) {
    console.error("Business status update failed:", error);
    return jsonResponse({ error: "Business status update failed." }, 500);
  }
});
