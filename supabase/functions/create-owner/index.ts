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
  if (!supabaseUrl || !serviceRoleKey) return jsonResponse({ error: "Owner provisioning is not configured." }, 503);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return jsonResponse({ error: "Authentication required." }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const token = authorization.slice("Bearer ".length);
  const { data: authResult, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authResult.user) return jsonResponse({ error: "Invalid session." }, 401);

  const { data: actor, error: actorError } = await adminClient
    .from("profiles")
    .select("id, name, email, role, status")
    .eq("user_id", authResult.user.id)
    .maybeSingle();
  if (actorError || actor?.role !== "admin" || actor.status !== "active") {
    return jsonResponse({ error: "Administrator access required." }, 403);
  }

  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : null;
    const businessId = typeof body.businessId === "string" && body.businessId ? body.businessId : null;
    const password = typeof body.password === "string" && body.password ? body.password : null;

    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: "A valid name and email are required." }, 400);
    }
    if (password && password.length < 8) return jsonResponse({ error: "Temporary passwords must be at least 8 characters." }, 400);

    let createdUser;
    if (password) {
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, phone },
      });
      if (error) return jsonResponse({ error: error.message }, 400);
      createdUser = data.user;
    } else {
      const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { name, phone },
        redirectTo: `${Deno.env.get("APP_URL") || req.headers.get("origin") || ""}/reset-password`,
      });
      if (error) return jsonResponse({ error: error.message }, 400);
      createdUser = data.user;
    }

    if (!createdUser) return jsonResponse({ error: "Supabase Auth did not return the new account." }, 502);

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .insert({ user_id: createdUser.id, name, email, phone, role: "owner", status: "active" })
      .select("*")
      .single();
    if (profileError) {
      await adminClient.auth.admin.deleteUser(createdUser.id);
      return jsonResponse({ error: profileError.message }, 500);
    }

    if (businessId) {
      const { error } = await adminClient.from("businesses").update({ owner_id: profile.id }).eq("id", businessId);
      if (error) {
        await adminClient.from("profiles").delete().eq("id", profile.id);
        await adminClient.auth.admin.deleteUser(createdUser.id);
        return jsonResponse({ error: error.message }, 400);
      }
    }

    await adminClient.from("audit_logs").insert({
      actor_user_id: authResult.user.id,
      actor_name: actor.name,
      actor_email: actor.email,
      action: "CREATE_OWNER",
      entity_type: "profile",
      entity_id: profile.id,
      metadata: { email },
    });

    return jsonResponse({ profile, invited: !password });
  } catch (error) {
    console.error("Owner provisioning failed:", error);
    return jsonResponse({ error: "Owner provisioning failed." }, 500);
  }
});
