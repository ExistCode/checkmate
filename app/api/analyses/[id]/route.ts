import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { deleteAnalysisById, getAnalysisById } from '@/lib/dynamo/repo';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const item = await getAnalysisById(params.id);
  if (!item) return NextResponse.json(null);
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const item = await getAnalysisById(params.id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if ((item as any).userId !== auth.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await deleteAnalysisById(params.id);
  return NextResponse.json({ success: true });
}

