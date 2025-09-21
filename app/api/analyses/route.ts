import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/better-auth";
import { createAnalysis, listAnalysesByUser } from "@/lib/db/repo";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await listAnalysesByUser(session.user.id, 50);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const id =
    globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  const platform = body?.metadata?.platform as string | undefined;
  await createAnalysis({
    id,
    userId: session.user.id,
    videoUrl: body.videoUrl,
    transcription: body?.transcription?.text ?? undefined,
    metadata: body.metadata,
    newsDetection: body.newsDetection,
    factCheck: body.factCheck,
    requiresFactCheck: body.requiresFactCheck === true,
    creatorCredibilityRating: body.creatorCredibilityRating,
    contentCreatorId: body.contentCreatorId,
    platform,
  });
  return NextResponse.json({ id });
}
