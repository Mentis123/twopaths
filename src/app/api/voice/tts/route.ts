import { synthesizeWithXai, isVoiceId, VoiceProviderError } from "@/lib/voice";
import type { Tradition, VoiceId } from "@/lib/types";

export const maxDuration = 30;

const validTraditions = new Set(["judaism", "buddhism"]);
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

  try {
    const audio = await synthesizeWithXai({
      text,
      voiceId,
      language,
      format,
      cache: body.cache !== false,
      tradition,
      topic: body.topic,
      speechSpeed,
    });

    return new Response(new Uint8Array(audio.bytes), {
      status: 200,
      headers: {
        "Content-Type": audio.mimeType,
        "Content-Length": String(audio.bytes.length),
        "Cache-Control": "private, max-age=3600",
        "X-Two-Paths-Audio-Cache": audio.cached ? "hit" : "miss",
        "X-Two-Paths-Audio-Hash": audio.cacheKey,
        "X-Two-Paths-Duration-Estimate": String(audio.durationEstimateSeconds),
        "X-Two-Paths-Voice": audio.voiceId,
      },
    });
  } catch (error) {
    if (error instanceof VoiceProviderError) {
      return Response.json(
        { error: error.message, retryable: error.retryable },
        { status: error.status },
      );
    }

    return Response.json(
      { error: "Voice narration is temporarily unavailable.", retryable: true },
      { status: 503 },
    );
  }
}
