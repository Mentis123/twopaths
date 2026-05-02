import { recentSessions } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") || "dad";
  const sessions = await recentSessions(userId).catch((error) => {
    console.error("History lookup failed", error);
    return [];
  });

  return Response.json({ sessions });
}
