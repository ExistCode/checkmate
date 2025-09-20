import { NextRequest, NextResponse } from "next/server";
import { addCreatorComment, listCreatorComments } from "@/lib/dynamo/repo";
import { getAuthContext } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { platform: string; creatorId: string } }
) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || "50");
  const items = await listCreatorComments(
    params.creatorId,
    params.platform,
    limit
  );
  return NextResponse.json(items);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { platform: string; creatorId: string } }
) {
  const auth = await getAuthContext();
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const content = (body?.comment || body?.content || "").toString();
  if (!content.trim())
    return NextResponse.json({ error: "Empty comment" }, { status: 400 });
  const now = Date.now();
  const id =
    globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  const saved = await addCreatorComment({
    id,
    creatorId: params.creatorId,
    platform: params.platform,
    userId: auth.userId,
    userName: body?.userName || undefined,
    content,
    createdAt: now,
  });
  return NextResponse.json(saved);
}
