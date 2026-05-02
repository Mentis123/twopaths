import "server-only";
import { buildQuestionTexts } from "@/lib/trove";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "Send id" }, { status: 400 });
  const texts = buildQuestionTexts(id);
  if (!texts) return Response.json({ error: "Unknown trove id" }, { status: 404 });
  return Response.json({ id, ...texts });
}
