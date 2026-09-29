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
  if (!supabaseUrl || !serviceRoleKey) return jsonResponse({ error: "Admin deletion is not configured." }, 503);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return jsonResponse({ error: "Authentication required." }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authResult, error: authError } = await adminClient.auth.getUser(authorization.slice("Bearer ".length));
  if (authError || !authResult.user) return jsonResponse({ error: "Invalid session." }, 401);

  const { data: actor, error: actorError } = await adminClient
    .from("profiles")
    .select("id, name, email, role, status")
    .eq("user_id", authResult.user.id)
    .maybeSingle();
  if (actorError) return jsonResponse({ error: "Could not verify administrator access." }, 500);
  if (actor?.role !== "admin" || actor.status !== "active") {
    return jsonResponse({ error: "Administrator access required." }, 403);
  }

  try {
    const rawBody = await req.json();
    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return jsonResponse({ error: "Invalid deletion request." }, 400);
    }

    const body = rawBody as { entity?: unknown; id?: unknown };
    if (!(["owner", "business"] as unknown[]).includes(body.entity) || typeof body.id !== "string" ||
      !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(body.id)) {
      return jsonResponse({ error: "A valid owner or business ID is required." }, 400);
    }

    if (body.entity === "owner") {
      const { data: owner, error: ownerError } = await adminClient
        .from("profiles")
        .select("id, user_id, name, email")
        .eq("id", body.id)
        .eq("role", "owner")
        .maybeSingle();
      if (ownerError) return jsonResponse({ error: "Could not load the owner profile." }, 500);
      if (!owner) return jsonResponse({ error: "Owner account not found." }, 404);
      if (!owner.user_id) return jsonResponse({ error: "Owner profile has no linked Auth account." }, 409);

      const { count, error: businessError } = await adminClient
        .from("businesses")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", owner.id);
      if (businessError) return jsonResponse({ error: "Could not verify the owner's business assignments." }, 500);
      if (count) {
        return jsonResponse({
          error: `Cannot delete this owner while ${count} business${count === 1 ? " is" : "es are"} assigned. Reassign or delete the business${count === 1 ? "" : "es"} first.`,
        }, 409);
      }

      const ownerAuditMetadata = { email: owner.email, name: owner.name, outcome: "pending" };
      const { data: ownerAudit, error: ownerAuditError } = await adminClient.from("audit_logs").insert({
        actor_user_id: authResult.user.id,
        actor_name: actor.name,
        actor_email: actor.email,
        action: "DELETE_OWNER",
        entity_type: "profile",
        entity_id: owner.id,
        metadata: ownerAuditMetadata,
      }).select("id").single();
      if (ownerAuditError || !ownerAudit) {
        console.error("Could not record owner deletion audit:", ownerAuditError?.message);
        return jsonResponse({ error: "Could not record the deletion in the audit log. The owner was not deleted." }, 500);
      }

      const { error: deleteError } = await adminClient.auth.admin.deleteUser(owner.user_id);
      if (deleteError) {
        console.error("Owner Auth deletion failed:", deleteError.message);
        const { error: auditUpdateError } = await adminClient.from("audit_logs")
          .update({ metadata: { ...ownerAuditMetadata, outcome: "failed" } })
          .eq("id", ownerAudit.id);
        if (auditUpdateError) console.error("Could not update failed owner deletion audit:", auditUpdateError.message);
        return jsonResponse({ error: "Could not delete the owner's Auth account." }, 502);
      }

      const { error: auditUpdateError } = await adminClient.from("audit_logs")
        .update({ metadata: { ...ownerAuditMetadata, outcome: "succeeded" } })
        .eq("id", ownerAudit.id);
      if (auditUpdateError) {
        console.error("Owner deleted but audit status could not be updated:", auditUpdateError.message);
        return jsonResponse({ deleted: true, auditWarning: "Owner was deleted; the audit log contains the request but its final status could not be recorded." });
      }

      return jsonResponse({ deleted: true });
    }

    const { data: business, error: businessError } = await adminClient
      .from("businesses")
      .select("id, name, slug, owner_id")
      .eq("id", body.id)
      .maybeSingle();
    if (businessError) return jsonResponse({ error: "Could not load the business." }, 500);
    if (!business) return jsonResponse({ error: "Business not found." }, 404);

    const businessAuditMetadata = {
      name: business.name,
      slug: business.slug,
      owner_id: business.owner_id,
      outcome: "pending",
    };
    const { data: businessAudit, error: businessAuditError } = await adminClient.from("audit_logs").insert({
      actor_user_id: authResult.user.id,
      actor_name: actor.name,
      actor_email: actor.email,
      action: "DELETE_BUSINESS",
      entity_type: "business",
      entity_id: business.id,
      metadata: businessAuditMetadata,
    }).select("id").single();
    if (businessAuditError || !businessAudit) {
      console.error("Could not record business deletion audit:", businessAuditError?.message);
      return jsonResponse({ error: "Could not record the deletion in the audit log. The business was not deleted." }, 500);
    }

    const { data: deletedBusiness, error: deleteError } = await adminClient
      .from("businesses")
      .delete()
      .eq("id", business.id)
      .select("id")
      .maybeSingle();
    if (deleteError) {
      console.error("Business deletion failed:", deleteError.message);
      const { error: auditUpdateError } = await adminClient.from("audit_logs")
        .update({ metadata: { ...businessAuditMetadata, outcome: "failed" } })
        .eq("id", businessAudit.id);
      if (auditUpdateError) console.error("Could not update failed business deletion audit:", auditUpdateError.message);
      return jsonResponse({ error: "Could not delete the business and its dependent records." }, 500);
    }
    if (!deletedBusiness) {
      const { error: auditUpdateError } = await adminClient.from("audit_logs")
        .update({ metadata: { ...businessAuditMetadata, outcome: "failed" } })
        .eq("id", businessAudit.id);
      if (auditUpdateError) console.error("Could not update missing business deletion audit:", auditUpdateError.message);
      return jsonResponse({ error: "Business was already deleted." }, 404);
    }

    const { error: auditUpdateError } = await adminClient.from("audit_logs")
      .update({ metadata: { ...businessAuditMetadata, outcome: "succeeded" } })
      .eq("id", businessAudit.id);
    if (auditUpdateError) {
      console.error("Business deleted but audit status could not be updated:", auditUpdateError.message);
      return jsonResponse({ deleted: true, auditWarning: "Business was deleted; the audit log contains the request but its final status could not be recorded." });
    }

    return jsonResponse({ deleted: true });
  } catch (error) {
    console.error("Admin deletion failed:", error);
    return jsonResponse({ error: "Deletion request could not be processed." }, 500);
  }
});