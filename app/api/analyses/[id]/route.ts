import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { deleteAnalysisById, getAnalysisById } from '@/lib/dynamo/repo';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const item = await getAnalysisById(id);
  if (!item) return NextResponse.json(null);
  return NextResponse.json(item);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;
  const item = await getAnalysisById(id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if ((item as any).userId !== auth.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await deleteAnalysisById(id);
  return NextResponse.json({ success: true });
}

