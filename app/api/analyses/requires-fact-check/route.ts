import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/better-auth";
import { listAnalysesRequiringFactCheckByUser } from "@/lib/db/repo";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || "10");
  const items = await listAnalysesRequiringFactCheckByUser(
    session.user.id,
    limit
  );
  return NextResponse.json(items);
}
