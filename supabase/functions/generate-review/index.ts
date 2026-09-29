import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ReviewRequest {
  business_id: string;
  session_id: string;
  rating: number;
  selected_tags: string[];
  feedback?: string;
}

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
  if (!supabaseUrl || !serviceRoleKey) return jsonResponse({ error: "Review generation is not configured." }, 503);

  try {
    const body = await req.json() as ReviewRequest;
    const { business_id, session_id, rating, selected_tags, feedback } = body;
    if (!business_id || !session_id || !Number.isInteger(rating) || rating < 1 || rating > 5 ||
      !Array.isArray(selected_tags) || selected_tags.length > 20 ||
      selected_tags.some((tag) => typeof tag !== "string" || tag.length > 80) ||
      (feedback !== undefined && (typeof feedback !== "string" || feedback.length > 2000))) {
      return jsonResponse({ error: "Invalid review input." }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: session, error: sessionError } = await adminClient.from("review_sessions")
      .select("business_id")
      .eq("session_id", session_id)
      .eq("business_id", business_id)
      .maybeSingle();
    if (sessionError || !session) return jsonResponse({ error: "Review session was not found." }, 404);

    const { data: business, error: businessError } = await adminClient.from("businesses")
      .select("name, status")
      .eq("id", business_id)
      .maybeSingle();
    if (businessError || !business || business.status !== "active") {
      return jsonResponse({ error: "This business is unavailable." }, 404);
    }

    const { data: settings } = await adminClient.from("platform_settings")
      .select("ai_provider, ai_model, ai_temperature, max_output_length")
      .eq("id", "default")
      .maybeSingle();
    const configuredProvider = settings?.ai_provider || Deno.env.get("AI_PROVIDER") || "gemini";
    const provider = configuredProvider === "hybrid_synthesizer" ? "gemini" : configuredProvider;
    const model = settings?.ai_model || Deno.env.get("AI_MODEL") || "gemini-2.5-flash";
    const apiKey = Deno.env.get("AI_API_KEY");
    if (!apiKey || !["gemini", "openai"].includes(provider)) {
      return jsonResponse({ error: "Review generation is temporarily unavailable." }, 503);
    }

    const prompt = `Write exactly 3 concise, natural review drafts for a customer who selected ${rating} out of 5 stars at ${business.name}.
Customer-selected points: ${selected_tags.length ? selected_tags.join(", ") : "none provided"}.
Customer's optional notes: ${feedback?.trim() || "none provided"}.

Use only those details. Never add facts, services, staff names, or experiences that the customer did not provide. Respect the selected rating without trying to change it. Avoid marketing language. Do not mention AI. Make the three versions meaningfully different and approximately 30-80 words each. Return only a JSON array of exactly 3 strings.`;

    let drafts: string[];
    if (provider === "gemini") {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: Number(settings?.ai_temperature ?? 0.7) },
          }),
        },
      );
      if (!response.ok) {
        console.error("Gemini request failed with status", response.status);
        return jsonResponse({ error: "Review generation is temporarily unavailable." }, 502);
      }
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      drafts = JSON.parse(text);
    } else {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "Return only a JSON object with one property drafts, whose value is an array of exactly 3 review draft strings." },
            { role: "user", content: `${prompt}\nReturn JSON in the shape {"drafts":["...","...","..."]}.` },
          ],
          response_format: { type: "json_object" },
          temperature: Number(settings?.ai_temperature ?? 0.7),
        }),
      });
      if (!response.ok) {
        console.error("OpenAI request failed with status", response.status);
        return jsonResponse({ error: "Review generation is temporarily unavailable." }, 502);
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);
      drafts = Array.isArray(parsed) ? parsed : parsed.drafts;
    }

    if (!Array.isArray(drafts) || drafts.length !== 3 || drafts.some((draft) => typeof draft !== "string" || !draft.trim())) {
      console.error("AI provider returned an invalid draft response.");
      return jsonResponse({ error: "Review generation returned an invalid response. Please try again." }, 502);
    }
    drafts = drafts.map((draft) => draft.trim());
    if (drafts.some((draft) => draft.length > (settings?.max_output_length || 350))) {
      return jsonResponse({ error: "Review generation returned an oversized response. Please try again." }, 502);
    }

    const { error: saveError } = await adminClient.from("ai_generations").insert({
      business_id,
      session_id,
      rating,
      input: { selected_tags, feedback: feedback || "" },
      output: drafts,
      provider,
      model,
    });
    if (saveError) {
      console.error("Could not record AI generation:", saveError.message);
      return jsonResponse({ error: "Could not save the generated review. Please try again." }, 500);
    }

    return jsonResponse({ drafts, provider, model });
  } catch (error) {
    console.error("Review generation failed:", error instanceof Error ? error.message : "Unknown error");
    return jsonResponse({ error: "Review generation is temporarily unavailable." }, 502);
  }
});
