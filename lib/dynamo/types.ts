export type IsoTime = string; // ISO 8601 string

export interface UserItem {
  PK: string; // USER#<userId>
  SK: 'PROFILE';
  type: 'USER';
  userId: string;
  // Generic auth identity (supports Clerk or Cognito)
  authProvider: 'clerk' | 'cognito';
  authSubject: string; // Clerk ID or Cognito sub
  // Optional legacy fields for compatibility
  clerkId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  username?: string;
  createdAt: number;
  updatedAt: number;
  // GSIs
  GSI1PK: string; // AUTH#<provider>#<subject>
  GSI1SK: string; // USER#<userId>
}

export interface CreatorItem {
  PK: string; // CREATOR#<creatorId>#PLATFORM#<platform>
  SK: 'PROFILE';
  type: 'CREATOR';
  creatorId: string;
  platform: string;
  creatorName?: string;
  credibilityRating: number;
  totalAnalyses: number;
  totalCredibilityScore: number;
  lastAnalyzedAt: number;
  createdAt: number;
  updatedAt: number;
  // GSIs
  GSI2PK: string; // PLATFORM#<platform>
  GSI2SK: string; // LAST#<ts>#<creatorId>
  GSI3PK: string; // PLATFORM#<platform>
  GSI3SK: string; // CRED#<pad>
}

export interface AnalysisItem {
  PK: string; // USER#<userId>
  SK: string; // ANALYSIS#<isoTime>#<id>
  type: 'ANALYSIS';
  id: string; // analysis id (ulid)
  userId: string;
  videoUrl: string;
  transcription?: {
    text: string;
    duration?: number;
    language?: string;
  };
  metadata?: {
    title: string;
    description?: string;
    creator?: string;
    originalUrl: string;
    contentType?: string;
    platform?: string;
  };
  newsDetection?: {
    hasNewsContent: boolean;
    confidence: number;
    newsKeywordsFound: string[];
    potentialClaims: string[];
    needsFactCheck: boolean;
    contentType: string;
  };
  factCheck?: unknown; // keep loose to match Convex any
  creatorCredibilityRating?: number;
  contentCreatorId?: string; // foreign id (Convex _id)
  contentCreatorCK?: string; // CREATOR#<creatorId>#PLATFORM#<platform>
  requiresFactCheck: boolean;
  createdAt: number;
  // GSIs (some are sparse)
  GSI4PK?: 'RFC';
  GSI4SK?: string; // <isoTime>#USER#<userId>#<id>
  GSI5PK?: string; // USER#<userId>
  GSI5SK?: string; // PLATFORM#<platform>#<isoTime>#<id>
  GSI6PK?: string; // CREATOR#<creatorId>#PLATFORM#<platform>
  GSI6SK?: string; // <isoTime>#<id>
  GSI7PK?: 'ANALYSIS';
  GSI7SK?: string; // <isoTime>#<userId>#<id>
}

export interface CommentItem {
  PK: string; // CREATOR#<creatorId>#PLATFORM#<platform>
  SK: string; // COMMENT#<isoTime>#<id>
  type: 'COMMENT';
  id: string; // comment id (ulid)
  userId: string; // USER table id
  creatorId: string;
  platform: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  // GSIs
  GSI8PK: string; // USER#<userId>
  GSI8SK: string; // COMMENT#<isoTime>#<id>
}

export type AnyItem = UserItem | CreatorItem | AnalysisItem | CommentItem;
