// app/lib/google-calendar.ts

const TOKEN_URL = "https://oauth2.googleapis.com/token";

let cachedAccessToken: string | null = null;
let cachedExpiresAt = 0; // timestamp en ms

export async function getAccessToken() {
  const now = Date.now();

  // Usa el token si todavía no va a expirar
  if (cachedAccessToken && now < cachedExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN!;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error("⚠️ Faltan variables de entorno para Google OAuth");
    throw new Error("Config de Google incompleta");
  }

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("refresh_token", refreshToken);
  params.append("grant_type", "refresh_token");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();
  console.log("Token response:", data); // <– déjalo por ahora para ver qué devuelve

  if (!res.ok) {
    console.error("❌ Error refrescando token:", data);
    throw new Error("No se pudo refrescar el access_token");
  }

  cachedAccessToken = data.access_token;
  cachedExpiresAt = now + data.expires_in * 1000;

  return cachedAccessToken!;
}
