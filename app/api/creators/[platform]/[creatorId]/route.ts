import { NextRequest, NextResponse } from "next/server";
import {
  getCreator,
  listAnalysesByCreator,
  listCreatorComments,
  addCreatorComment,
} from "@/lib/dynamo/repo";
import { getAuthContext } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { platform: string; creatorId: string } }
) {
  const item = await getCreator(params.creatorId, params.platform);
  if (!item) return NextResponse.json(null);
  return NextResponse.json(item);
}

// List analyses for creator
export async function POST(
  req: NextRequest,
  { params }: { params: { platform: string; creatorId: string } }
) {
  const { action } = await req.json().catch(() => ({ action: undefined }));
  if (action === "listAnalyses") {
    const { limit } = (await req.json().catch(() => ({}))) as any;
    const items = await listAnalysesByCreator(
      params.creatorId,
      params.platform,
      Number(limit) || 10
    );
    return NextResponse.json(items);
  }
  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}

// Comments subroutes
export async function PUT(
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { platform: string; creatorId: string } }
) {
  // List comments (PATCH chosen to avoid GET body; could be GET with query too)
  const { limit } = (await req.json().catch(() => ({}))) as any;
  const items = await listCreatorComments(
    params.creatorId,
    params.platform,
    Number(limit) || 50
  );
  return NextResponse.json(items);
}
