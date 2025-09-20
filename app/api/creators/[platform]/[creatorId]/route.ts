import { NextRequest, NextResponse } from 'next/server';
import { getCreator } from '@/lib/dynamo/repo';

export async function GET(_req: NextRequest, { params }: { params: { platform: string; creatorId: string } }) {
  const item = await getCreator(params.creatorId, params.platform);
  if (!item) return NextResponse.json(null);
  return NextResponse.json(item);
}

