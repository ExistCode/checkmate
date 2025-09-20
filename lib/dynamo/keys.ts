import type { IsoTime } from './types';

const iso = (ms: number): IsoTime => new Date(ms).toISOString();
const padRating = (n: number) => (n >= 0 && n < 10 ? n.toFixed(1).padStart(5, '0') : n.toFixed(1));

// Primary keys
export const pkUser = (userId: string) => `USER#${userId}`;
export const skUserProfile = () => `PROFILE`;

export const pkCreator = (creatorId: string, platform: string) => `CREATOR#${creatorId}#PLATFORM#${platform}`;
export const skCreatorProfile = () => `PROFILE`;

export const skAnalysis = (createdAtMs: number, id: string) => `ANALYSIS#${iso(createdAtMs)}#${id}`;
export const skComment = (createdAtMs: number, id: string) => `COMMENT#${iso(createdAtMs)}#${id}`;

// GSI builders
export const gsi1UserByAuth = (provider: 'clerk' | 'cognito', subject: string, userId: string) => ({
  GSI1PK: `AUTH#${provider}#${subject}`,
  GSI1SK: `USER#${userId}`,
});

export const gsi2CreatorByPlatformLast = (platform: string, lastAnalyzedAt: number, creatorId: string) => ({
  GSI2PK: `PLATFORM#${platform}`,
  GSI2SK: `LAST#${lastAnalyzedAt}#${creatorId}`,
});

export const gsi3CreatorByPlatformCred = (platform: string, credibilityRating: number, creatorId: string) => ({
  GSI3PK: `PLATFORM#${platform}`,
  GSI3SK: `CRED#${padRating(credibilityRating)}#${creatorId}`,
});

export const gsi4AnalysesRFC = (createdAtMs: number, userId: string, id: string) => ({
  GSI4PK: 'RFC' as const,
  GSI4SK: `${iso(createdAtMs)}#USER#${userId}#${id}`,
});

export const gsi5AnalysesByUserPlatform = (userId: string, platform: string | undefined, createdAtMs: number, id: string) => ({
  GSI5PK: `USER#${userId}`,
  GSI5SK: `PLATFORM#${platform ?? 'unknown'}#${iso(createdAtMs)}#${id}`,
});

export const gsi6AnalysesByCreator = (creatorId: string, platform: string, createdAtMs: number, id: string) => ({
  GSI6PK: pkCreator(creatorId, platform),
  GSI6SK: `${iso(createdAtMs)}#${id}`,
});

export const gsi7AnalysesByCreatedAt = (createdAtMs: number, userId: string, id: string) => ({
  GSI7PK: 'ANALYSIS' as const,
  GSI7SK: `${iso(createdAtMs)}#${userId}#${id}`,
});

export const gsi8CommentsByUser = (userId: string, createdAtMs: number, id: string) => ({
  GSI8PK: `USER#${userId}`,
  GSI8SK: skComment(createdAtMs, id),
});
