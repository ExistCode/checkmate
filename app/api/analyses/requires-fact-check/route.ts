import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { listAnalysesRequiringFactCheckByUser } from '@/lib/dynamo/repo';

export async function GET(req: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') || '10');
  const items = await listAnalysesRequiringFactCheckByUser(auth.userId, limit);
  return NextResponse.json(items);
}

