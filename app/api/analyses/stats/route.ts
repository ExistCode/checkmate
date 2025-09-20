import { NextRequest, NextResponse } from 'next/server';
import { ddbDoc } from '@/lib/aws';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

const TABLE = process.env.DDB_TABLE as string;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') || '500');
  const res = await ddbDoc.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'GSI7',
    KeyConditionExpression: 'GSI7PK = :p',
    ExpressionAttributeValues: { ':p': 'ANALYSIS' },
    ScanIndexForward: false,
    Limit: Math.min(limit, 2000),
  }));
  const items = res.Items ?? [];
  const stats = items.reduce((acc, a: any) => {
    if (a.requiresFactCheck) acc.requiresFactCheck++;
    if (a.newsDetection?.hasNewsContent) acc.hasNewsContent++;
    const s = a.factCheck?.summary;
    if (s) {
      acc.factCheckSummary.verifiedTrue += s.verifiedTrue || 0;
      acc.factCheckSummary.verifiedFalse += s.verifiedFalse || 0;
      acc.factCheckSummary.misleading += s.misleading || 0;
      acc.factCheckSummary.unverifiable += s.unverifiable || 0;
      acc.factCheckSummary.needsVerification += s.needsVerification || 0;
    }
    acc.totalAnalyses++;
    return acc;
  }, {
    totalAnalyses: 0,
    requiresFactCheck: 0,
    hasNewsContent: 0,
    factCheckSummary: {
      verifiedTrue: 0,
      verifiedFalse: 0,
      misleading: 0,
      unverifiable: 0,
      needsVerification: 0,
    },
  });
  return NextResponse.json(stats);
}

