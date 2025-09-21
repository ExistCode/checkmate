import { and, desc, eq } from "drizzle-orm";
import { db } from "./index";
import { analyses, creators, comments, users } from "./schema";

export async function upsertUser(u: {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  username?: string | null;
}) {
  // Temporary debug log
  // eslint-disable-next-line no-console
  console.log("[db] upsertUser", { id: u.id, email: u.email });
  await db
    .insert(users)
    .values({
      id: u.id,
      email: u.email,
      firstName: u.firstName ?? null,
      lastName: u.lastName ?? null,
      imageUrl: u.imageUrl ?? null,
      username: u.username ?? null,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: u.email,
        firstName: u.firstName ?? null,
        lastName: u.lastName ?? null,
        imageUrl: u.imageUrl ?? null,
        username: u.username ?? null,
        updatedAt: new Date(),
      },
    });
}

export async function createAnalysis(input: {
  id: string;
  userId: string;
  videoUrl: string;
  transcription?: string;
  metadata?: unknown;
  newsDetection?: unknown;
  factCheck?: unknown;
  requiresFactCheck?: boolean;
  creatorCredibilityRating?: number;
  contentCreatorId?: string;
  platform?: string;
}) {
  await db.insert(analyses).values({
    id: input.id,
    userId: input.userId,
    videoUrl: input.videoUrl,
    transcription: input.transcription ?? null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    newsDetection: input.newsDetection
      ? JSON.stringify(input.newsDetection)
      : null,
    factCheck: input.factCheck ? JSON.stringify(input.factCheck) : null,
    requiresFactCheck: !!input.requiresFactCheck,
    creatorCredibilityRating: input.creatorCredibilityRating ?? null,
    contentCreatorId: input.contentCreatorId ?? null,
    platform: input.platform ?? null,
  });
}

export async function listAnalysesByUser(userId: string, limit = 20) {
  return db
    .select()
    .from(analyses)
    .where(eq(analyses.userId, userId))
    .orderBy(desc(analyses.createdAt))
    .limit(limit);
}

export async function getAnalysisById(id: string) {
  const rows = await db
    .select()
    .from(analyses)
    .where(eq(analyses.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function deleteAnalysisById(id: string) {
  const res = await db.delete(analyses).where(eq(analyses.id, id));
  return (res as any).rowCount ? (res as any).rowCount > 0 : true;
}

export async function listAnalysesRequiringFactCheckByUser(
  userId: string,
  limit = 10
) {
  return db
    .select()
    .from(analyses)
    .where(
      and(eq(analyses.userId, userId), eq(analyses.requiresFactCheck, true))
    )
    .orderBy(desc(analyses.createdAt))
    .limit(limit);
}

export async function listAnalysesByCreator(
  creatorId: string,
  platform: string,
  limit = 10
) {
  return db
    .select()
    .from(analyses)
    .where(
      and(
        eq(analyses.contentCreatorId, creatorId),
        eq(analyses.platform, platform)
      )
    )
    .orderBy(desc(analyses.createdAt))
    .limit(limit);
}

export async function upsertCreator(input: {
  id: string;
  platform: string;
  creatorName?: string;
  credibilityRating?: number;
  lastAnalyzedAt?: Date;
}) {
  await db
    .insert(creators)
    .values({
      id: input.id,
      platform: input.platform,
      creatorName: input.creatorName ?? null,
      credibilityRating: input.credibilityRating ?? 0,
      lastAnalyzedAt: input.lastAnalyzedAt ?? null,
    })
    .onConflictDoUpdate({
      target: [creators.id, creators.platform],
      set: {
        creatorName: input.creatorName ?? null,
        credibilityRating: input.credibilityRating ?? 0,
        lastAnalyzedAt: input.lastAnalyzedAt ?? null,
        updatedAt: new Date(),
      },
    });
}

export async function getCreator(creatorId: string, platform: string) {
  const rows = await db
    .select()
    .from(creators)
    .where(and(eq(creators.id, creatorId), eq(creators.platform, platform)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listTopCreatorsByCredibility(
  platform: string,
  limit = 10
) {
  return db
    .select()
    .from(creators)
    .where(eq(creators.platform, platform))
    .orderBy(desc(creators.credibilityRating))
    .limit(limit);
}

export async function listBottomCreatorsByCredibility(
  platform: string,
  limit = 10
) {
  return db
    .select()
    .from(creators)
    .where(eq(creators.platform, platform))
    .orderBy(creators.credibilityRating)
    .limit(limit);
}

export async function listCreatorComments(
  creatorId: string,
  platform: string,
  limit = 50
) {
  return db
    .select()
    .from(comments)
    .where(
      and(eq(comments.creatorId, creatorId), eq(comments.platform, platform))
    )
    .orderBy(desc(comments.createdAt))
    .limit(limit);
}

export async function addCreatorComment(input: {
  id: string;
  creatorId: string;
  platform: string;
  userId: string;
  userName?: string;
  content: string;
}) {
  await db.insert(comments).values({
    id: input.id,
    creatorId: input.creatorId,
    platform: input.platform,
    userId: input.userId,
    userName: input.userName ?? null,
    content: input.content,
  });
}
