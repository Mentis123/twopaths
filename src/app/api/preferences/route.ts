import { getPreferences, savePreferences, type Preferences } from "@/lib/db";

const validModes = new Set(["listen", "story", "quiz"]);
const validBias = new Set(["judaism", "buddhism", "both", "balanced"]);

const defaults: Preferences = {
  preferred_voice: "Kore",
  speech_speed: 1.0,
  default_mode: "listen",
  preferred_session_length: 5,
  show_text: true,
  tradition_bias: "balanced",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") || "dad";
  const prefs = await getPreferences(userId).catch((error) => {
    console.error("Preferences lookup failed", error);
    return null;
  });

  return Response.json({ preferences: prefs ?? defaults, persisted: Boolean(prefs) });
}

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | (Partial<Preferences> & { userId?: string })
    | null;

  if (!body) {
    return Response.json({ error: "Send preference values." }, { status: 400 });
  }

  const userId = body.userId || "dad";
  const update: Partial<Preferences> = {};

  if (typeof body.preferred_voice === "string") {
    update.preferred_voice = body.preferred_voice.slice(0, 64);
  }
  if (typeof body.speech_speed === "number" && Number.isFinite(body.speech_speed)) {
    update.speech_speed = Math.max(0.5, Math.min(1.5, body.speech_speed));
  }
  if (typeof body.default_mode === "string" && validModes.has(body.default_mode)) {
    update.default_mode = body.default_mode;
  }
  if (
    typeof body.preferred_session_length === "number" &&
    Number.isFinite(body.preferred_session_length)
  ) {
    update.preferred_session_length = Math.max(
      3,
      Math.min(10, Math.round(body.preferred_session_length)),
    );
  }
  if (typeof body.show_text === "boolean") {
    update.show_text = body.show_text;
  }
  if (typeof body.tradition_bias === "string" && validBias.has(body.tradition_bias)) {
    update.tradition_bias = body.tradition_bias;
  }

  const persisted = await savePreferences(userId, update).catch((error) => {
    console.error("Preferences save failed", error);
    return false;
  });

  return Response.json({ persisted, applied: update });
}
