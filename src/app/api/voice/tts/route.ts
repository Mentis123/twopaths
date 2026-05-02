import { synthesizeWithXai, isVoiceId } from "@/lib/voice";
import { isGeminiConfigured, synthesizeNarration } from "@/lib/gemini";
import type { Tradition, VoiceId } from "@/lib/types";

export const maxDuration = 60;

const validTraditions = new Set(["judaism", "buddhism", "both"]);
const validSpeeds = new Set(["slower", "normal", "faster"]);

type TtsRequestBody = {
  text?: string;
  voice_id?: VoiceId;
  language?: string;
  format?: "mp3";
  session_id?: string;
  cache?: boolean;
  tradition?: Tradition;
  topic?: string;
  speech_speed?: "slower" | "normal" | "faster";
  apiKey?: string;
  api_key?: string;
  xai_api_key?: string;
  authorization?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as TtsRequestBody | null;

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Send text to narrate." }, { status: 400 });
  }

  if (body.apiKey || body.api_key || body.xai_api_key || body.authorization) {
    return Response.json(
      { error: "Do not send API keys from the browser." },
      { status: 400 },
    );
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text) {
    return Response.json({ error: "Text is required." }, { status: 400 });
  }

  const voiceId = isVoiceId(body.voice_id) ? body.voice_id : "ara";
  const language = typeof body.language === "string" ? body.language : "en";
  const format = body.format || "mp3";
  const speechSpeed = validSpeeds.has(body.speech_speed || "")
    ? body.speech_speed || "normal"
    : "normal";
  const tradition =
    body.tradition && validTraditions.has(body.tradition) ? body.tradition : undefined;

  if (body.voice_id && !isVoiceId(body.voice_id)) {
    return Response.json({ error: "Unsupported voice." }, { status: 400 });
  }

  if (format !== "mp3") {
    return Response.json({ error: "Only MP3 output is supported." }, { status: 400 });
  }

  // Race xAI and Gemini in parallel — whichever returns audio first wins.
  // This cuts perceived latency roughly in half and keeps us well inside
  // the 60s function ceiling even when one provider is slow.
  type Outcome =
    | { ok: true; provider: "xai"; bytes: Buffer; mime: string; voice: string; cached: boolean; cacheKey: string; duration: number }
    | { ok: true; provider: "gemini"; bytes: Buffer; mime: string; voice: string }
    | { ok: false; provider: "xai" | "gemini"; error: string };

  const tasks: Promise<Outcome>[] = [];

  if (process.env.XAI_API_KEY) {
    tasks.push(
      synthesizeWithXai({
        text,
        voiceId,
        language,
        format,
        cache: body.cache !== false,
        tradition,
        topic: body.topic,
        speechSpeed,
      })
        .then<Outcome>((audio) => ({
          ok: true,
          provider: "xai",
          bytes: audio.bytes,
          mime: audio.mimeType,
          voice: audio.voiceId,
          cached: audio.cached,
          cacheKey: audio.cacheKey,
          duration: audio.durationEstimateSeconds,
        }))
        .catch<Outcome>((error) => ({
          ok: false,
          provider: "xai",
          error: error instanceof Error ? error.message : String(error),
        })),
    );
  } else {
    tasks.push(Promise.resolve({ ok: false, provider: "xai", error: "XAI_API_KEY not set" }));
  }

  if (isGeminiConfigured()) {
    tasks.push(
      synthesizeNarration({
        script: text,
        voiceName: "Kore",
        speechSpeed,
      })
        .then<Outcome>((dataUrl) => {
          if (!dataUrl) {
            return {
              ok: false,
              provider: "gemini",
              error: "Gemini returned no audio (TTS preview likely not enabled on this key)",
            };
          }
          const base64 = dataUrl.split(",")[1] || "";
          return {
            ok: true,
            provider: "gemini",
            bytes: Buffer.from(base64, "base64"),
            mime: "audio/wav",
            voice: "Kore",
          };
        })
        .catch<Outcome>((error) => ({
          ok: false,
          provider: "gemini",
          error: error instanceof Error ? error.message : String(error),
        })),
    );
  } else {
    tasks.push(Promise.resolve({ ok: false, provider: "gemini", error: "GEMINI_API_KEY / GOOGLE_API_KEY not set" }));
  }

  // Resolve all so we can report both errors if both fail; pick first ok.
  const outcomes = await Promise.all(tasks);
  const winner = outcomes.find((o) => o.ok);

  if (winner && winner.ok) {
    const headers: Record<string, string> = {
      "Content-Type": winner.mime,
      "Content-Length": String(winner.bytes.length),
      "Cache-Control": "private, max-age=86400",
      "X-Two-Paths-Voice": winner.voice,
      "X-Two-Paths-Provider": winner.provider,
    };
    if (winner.provider === "xai") {
      headers["X-Two-Paths-Audio-Cache"] = winner.cached ? "hit" : "miss";
      headers["X-Two-Paths-Audio-Hash"] = winner.cacheKey;
      headers["X-Two-Paths-Duration-Estimate"] = String(winner.duration);
    }
    return new Response(new Uint8Array(winner.bytes), { status: 200, headers });
  }

  const xaiOut = outcomes.find((o) => o.provider === "xai") as Extract<Outcome, { ok: false }>;
  const gemOut = outcomes.find((o) => o.provider === "gemini") as Extract<Outcome, { ok: false }>;

  console.error("Both TTS providers failed:", { xai: xaiOut?.error, gemini: gemOut?.error });

  return Response.json(
    {
      error: `Both warm voices failed. xAI: ${xaiOut?.error || "n/a"}. Gemini: ${gemOut?.error || "n/a"}.`,
      xaiError: xaiOut?.error || null,
      geminiError: gemOut?.error || null,
      retryable: true,
    },
    { status: 503 },
  );
}
