import { synthesizeWithXai, isVoiceId, VoiceProviderError } from "@/lib/voice";
import { isGeminiConfigured, synthesizeNarration } from "@/lib/gemini";
import type { Tradition, VoiceId } from "@/lib/types";

export const maxDuration = 30;

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

  let xaiError: VoiceProviderError | null = null;
  let geminiError: string | null = null;

  // Skip xAI entirely if no key — saves a useless 401 round-trip
  if (!process.env.XAI_API_KEY) {
    xaiError = new VoiceProviderError("XAI_API_KEY not set", 401, false);
  } else {
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
          "X-Two-Paths-Provider": "xai",
        },
      });
    } catch (error) {
      if (error instanceof VoiceProviderError) {
        xaiError = error;
      } else {
        xaiError = new VoiceProviderError(
          error instanceof Error ? error.message : "xAI voice request failed.",
          503,
          true,
        );
      }
      console.error("xAI TTS failed", xaiError.message);
    }
  }

  // Gemini fallback — keeps narration warm even when xAI key/quota fails.
  if (!isGeminiConfigured()) {
    geminiError = "GEMINI_API_KEY / GOOGLE_API_KEY not set";
  } else {
    try {
      const dataUrl = await synthesizeNarration({
        script: text,
        voiceName: "Kore",
        speechSpeed,
      });

      if (dataUrl) {
        const base64 = dataUrl.split(",")[1] || "";
        const bytes = Buffer.from(base64, "base64");
        return new Response(new Uint8Array(bytes), {
          status: 200,
          headers: {
            "Content-Type": "audio/wav",
            "Content-Length": String(bytes.length),
            "Cache-Control": "private, max-age=3600",
            "X-Two-Paths-Voice": "Kore",
            "X-Two-Paths-Provider": "gemini",
            "X-Two-Paths-Fallback-Reason": xaiError.message,
          },
        });
      }
      // null = Gemini ran but returned no audio. Most likely the TTS preview
      // model is not enabled on this API key, or the script tripped a safety
      // filter. The synthesizeNarration() call already console.error'd.
      geminiError =
        "Gemini returned no audio (likely TTS preview model not enabled on this key, or content filter)";
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error("Gemini TTS fallback failed", detail);
      geminiError = detail.slice(0, 200);
    }
  }

  return Response.json(
    {
      error: `Both warm voices failed. xAI: ${xaiError.message}. Gemini: ${geminiError}.`,
      xaiError: xaiError.message,
      geminiError,
      retryable: xaiError.retryable,
    },
    { status: xaiError.status },
  );
}
