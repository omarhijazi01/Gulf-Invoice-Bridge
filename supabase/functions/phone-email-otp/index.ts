import { createClient } from "npm:@supabase/supabase-js@2.117.0";

const allowedOrigins = new Set([
  "https://gulf-invoice-bridge.omarmaheer921.workers.dev",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);
const url = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});
const otp = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
  auth: { persistSession: false },
});

function reply(body: object, status: number, origin: string) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "null",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, apikey",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      Vary: "Origin",
    },
  });
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin") || "";
  if (request.method === "OPTIONS") return reply({}, 204, origin);
  if (request.method !== "POST" || (origin && !allowedOrigins.has(origin)))
    return reply({ error: "Request denied" }, 403, origin);

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return reply({ error: "Invalid request" }, 400, origin);
  }

  if (payload.action === "verify") {
    if (
      typeof payload.challenge !== "string" ||
      !/^[0-9a-f-]{36}$/.test(payload.challenge) ||
      typeof payload.code !== "string" ||
      !/^\d{6}$/.test(payload.code)
    ) return reply({ error: "Invalid code" }, 400, origin);
    const { data: challenge, error } = await admin
      .from("phone_otp_challenges")
      .select("id,email,attempts,created_at")
      .eq("id", payload.challenge)
      .maybeSingle();
    if (error) return reply({ error: "Temporarily unavailable" }, 503, origin);
    if (
      !challenge ||
      challenge.attempts >= 5 ||
      Date.now() - new Date(challenge.created_at).getTime() > 10 * 60 * 1000
    ) return reply({ error: "Code expired. Request another one." }, 400, origin);
    await admin.from("phone_otp_challenges").update({ attempts: challenge.attempts + 1 }).eq("id", challenge.id);
    if (!challenge.email) return reply({ error: "Invalid code" }, 400, origin);
    const { data, error: verifyError } = await otp.auth.verifyOtp({
      email: challenge.email,
      token: payload.code,
      type: "email",
    });
    if (verifyError || !data.session)
      return reply({ error: "Invalid or expired code" }, 400, origin);
    await admin.from("phone_otp_challenges").delete().eq("id", challenge.id);
    return reply({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    }, 200, origin);
  }

  if (payload.action !== "send" || typeof payload.phone !== "string" || !/^\+[1-9]\d{7,14}$/.test(payload.phone))
    return reply({ error: "Invalid phone number" }, 400, origin);
  const phone = payload.phone;
  const requester = (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    "unknown"
  ).split(",")[0].trim().slice(0, 80);
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const [phoneLimit, requesterLimit] = await Promise.all([
    admin.from("phone_otp_requests").select("id", { count: "exact", head: true }).eq("phone", phone).gte("created_at", since),
    admin.from("phone_otp_requests").select("id", { count: "exact", head: true }).eq("requester", requester).gte("created_at", since),
  ]);
  if (phoneLimit.error || requesterLimit.error)
    return reply({ error: "Temporarily unavailable" }, 503, origin);
  if ((phoneLimit.count ?? 0) >= 2 || (requesterLimit.count ?? 0) >= 6)
    return reply({ error: "Please wait before requesting another code" }, 429, origin);
  const { error: requestError } = await admin.from("phone_otp_requests").insert({ phone, requester });
  if (requestError) return reply({ error: "Temporarily unavailable" }, 503, origin);
  const { data: alias, error: aliasError } = await admin.from("phone_email_aliases").select("email").eq("phone", phone).maybeSingle();
  if (aliasError) return reply({ error: "Temporarily unavailable" }, 503, origin);
  const { data: challenge, error: challengeError } = await admin
    .from("phone_otp_challenges")
    .insert({ phone, email: alias?.email ?? null })
    .select("id")
    .single();
  if (challengeError) return reply({ error: "Temporarily unavailable" }, 503, origin);
  if (alias?.email) {
    const { error: sendError } = await otp.auth.signInWithOtp({
      email: alias.email,
      options: { shouldCreateUser: false },
    });
    if (sendError) console.error("OTP delivery failed", sendError.message);
  }
  return reply({ challenge: challenge.id }, 200, origin);
});
