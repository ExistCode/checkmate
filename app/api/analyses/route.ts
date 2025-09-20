import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { buildAnalysisItem, putItem, listAnalysesByUser } from '@/lib/dynamo/repo';

export async function GET(req: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const items = await listAnalysesByUser(auth.userId, 50);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const id = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
  const now = Date.now();
  const platform = body?.metadata?.platform as string | undefined;
  const creatorId = body?.metadata?.creator as string | undefined;
  const contentCreatorCK = platform && creatorId ? `CREATOR#${creatorId}#PLATFORM#${platform}` : undefined;
  const item = buildAnalysisItem(id, auth.userId, now, {
    videoUrl: body.videoUrl,
    transcription: body.transcription,
    metadata: body.metadata,
    newsDetection: body.newsDetection,
    factCheck: body.factCheck,
    requiresFactCheck: body.requiresFactCheck === true,
    creatorCredibilityRating: body.creatorCredibilityRating,
    contentCreatorId: body.contentCreatorId,
    contentCreatorCK,
  } as any);
  await putItem(item);
  return NextResponse.json({ id });
}

