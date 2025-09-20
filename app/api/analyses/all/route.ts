import { NextRequest, NextResponse } from "next/server";
import { ddbDoc } from "@/lib/aws";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

const TABLE = (process.env.DDB_TABLE ||
  process.env.DDB_TABLE_ANALYSES) as string;
if (!TABLE)
  throw new Error(
    "DynamoDB table name is not configured. Set DDB_TABLE or DDB_TABLE_ANALYSES."
  );

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || "50");
  const res = await ddbDoc.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: "GSI7",
      KeyConditionExpression: "GSI7PK = :p",
      ExpressionAttributeValues: { ":p": "ANALYSIS" },
      ScanIndexForward: false,
      Limit: Math.min(limit, 200),
    })
  );
  return NextResponse.json(res.Items ?? []);
}
