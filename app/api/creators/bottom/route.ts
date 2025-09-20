import { NextRequest, NextResponse } from 'next/server';
import { listBottomCreatorsByCredibility } from '@/lib/dynamo/repo';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get('platform');
  const limit = Number(searchParams.get('limit') || '10');
  if (!platform) return NextResponse.json([]);
  const items = await listBottomCreatorsByCredibility(platform, limit);
  return NextResponse.json(items);
}

