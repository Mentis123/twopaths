import "server-only";
import { isGeminiConfigured, synthesizeNarration, textModel, ttsModel } from "@/lib/gemini";

export async function GET() {
  const env = {
    XAI_API_KEY: Boolean(process.env.XAI_API_KEY),
    XAI_API_KEY_length: process.env.XAI_API_KEY?.length || 0,
    GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY),
    GEMINI_API_KEY_length: process.env.GEMINI_API_KEY?.length || 0,
    GOOGLE_API_KEY: Boolean(process.env.GOOGLE_API_KEY),
    GEMINI_TEXT_MODEL: textModel(),
    GEMINI_TTS_MODEL: ttsModel(),
    isGeminiConfigured: isGeminiConfigured(),
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  };

  // Probe Gemini TTS with a tiny sentence so we can see the failure mode.
  const probe: { ok: boolean; bytes?: number; error?: string } = { ok: false };
  if (isGeminiConfigured()) {
    try {
      const dataUrl = await synthesizeNarration({
        script: "Hello. This is a short test.",
        voiceName: "Kore",
        speechSpeed: "normal",
      });
      if (dataUrl) {
        const base64 = dataUrl.split(",")[1] || "";
        probe.ok = true;
        probe.bytes = Math.floor((base64.length * 3) / 4);
      } else {
        probe.error = "Gemini returned no audio (model probably not enabled on this key — see Vercel logs for finishReason)";
      }
    } catch (error) {
      probe.error = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    }
  } else {
    probe.error = "GEMINI_API_KEY not set";
  }

  // Probe xAI TTS with a tiny sentence
  const xaiProbe: { ok: boolean; status?: number; error?: string; bytes?: number } = { ok: false };
  if (process.env.XAI_API_KEY) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch("https://api.x.ai/v1/tts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.XAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: "Hello. This is a short test.",
          voice_id: "ara",
          language: "en",
          output_format: { codec: "mp3", sample_rate: 24000, bit_rate: 128000 },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      xaiProbe.status = response.status;
      if (response.ok) {
        const buf = await response.arrayBuffer();
        xaiProbe.ok = true;
        xaiProbe.bytes = buf.byteLength;
      } else {
        const detail = await response.text().catch(() => "");
        xaiProbe.error = `${response.status} ${response.statusText}: ${detail.slice(0, 240)}`;
      }
    } catch (error) {
      xaiProbe.error = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    }
  } else {
    xaiProbe.error = "XAI_API_KEY not set";
  }

  return Response.json({ env, gemini: probe, xai: xaiProbe }, {
    headers: { "Cache-Control": "no-store" },
  });
}
