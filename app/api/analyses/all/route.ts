import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyses } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || "50"), 200);
  const rows = await db
    .select()
    .from(analyses)
    .orderBy(desc(analyses.createdAt))
    .limit(limit);
  return NextResponse.json(rows);
}
