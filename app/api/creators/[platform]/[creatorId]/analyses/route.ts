import { NextRequest, NextResponse } from "next/server";
import { listAnalysesByCreator } from "@/lib/dynamo/repo";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ platform: string; creatorId: string }> }
) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || "10");
  const { creatorId, platform } = await context.params;
  const items = await listAnalysesByCreator(creatorId, platform, limit);
  return NextResponse.json(items);
}
