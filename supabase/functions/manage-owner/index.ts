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
  if (!supabaseUrl || !serviceRoleKey) return jsonResponse({ error: "Owner management is not configured." }, 503);

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
    if (body.action !== "set-status" || typeof body.profileId !== "string" || !["active", "disabled"].includes(body.status)) {
      return jsonResponse({ error: "Invalid owner status request." }, 400);
    }

    const { data: profile, error: profileError } = await adminClient.from("profiles")
      .select("*")
      .eq("id", body.profileId)
      .eq("role", "owner")
      .single();
    if (profileError || !profile) return jsonResponse({ error: "Owner account not found." }, 404);

    const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(profile.user_id, {
      ban_duration: body.status === "disabled" ? "876000h" : "none",
    });
    if (authUpdateError) return jsonResponse({ error: authUpdateError.message }, 400);

    const { data: updated, error: updateError } = await adminClient.from("profiles")
      .update({ status: body.status })
      .eq("id", profile.id)
      .select("*")
      .single();
    if (updateError) {
      await adminClient.auth.admin.updateUserById(profile.user_id, {
        ban_duration: profile.status === "disabled" ? "876000h" : "none",
      });
      return jsonResponse({ error: updateError.message }, 500);
    }

    await adminClient.from("audit_logs").insert({
      actor_user_id: authResult.user.id,
      actor_name: actor.name,
      actor_email: actor.email,
      action: body.status === "disabled" ? "DISABLE_OWNER" : "ENABLE_OWNER",
      entity_type: "profile",
      entity_id: profile.id,
      metadata: { email: profile.email, status: body.status },
    });

    return jsonResponse({ profile: updated });
  } catch (error) {
    console.error("Owner status update failed:", error);
    return jsonResponse({ error: "Owner status update failed." }, 500);
  }
});
