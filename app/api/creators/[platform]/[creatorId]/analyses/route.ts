import { NextRequest, NextResponse } from "next/server";
import { listAnalysesByCreator } from "@/lib/dynamo/repo";

export async function GET(
  req: NextRequest,
  { params }: { params: { platform: string; creatorId: string } }
) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || "10");
  const items = await listAnalysesByCreator(
    params.creatorId,
    params.platform,
    limit
  );
  return NextResponse.json(items);
}
