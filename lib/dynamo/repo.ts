import { PutCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddbDoc } from '../aws';
import type { AnalysisItem, CommentItem, CreatorItem, UserItem } from './types';
import {
  pkUser,
  skUserProfile,
  pkCreator,
  skCreatorProfile,
  skAnalysis,
  skComment,
  gsi1UserByAuth,
  gsi2CreatorByPlatformLast,
  gsi3CreatorByPlatformCred,
  gsi4AnalysesRFC,
  gsi5AnalysesByUserPlatform,
  gsi6AnalysesByCreator,
  gsi7AnalysesByCreatedAt,
  gsi8CommentsByUser,
} from './keys';

const TABLE = process.env.DDB_TABLE as string;

// Builders — construct fully-formed items matching the single-table schema
export const buildUserItem = (
  userId: string,
  data: Omit<UserItem, 'PK'|'SK'|'type'|'userId'|'GSI1PK'|'GSI1SK'>
): UserItem => ({
  PK: pkUser(userId),
  SK: skUserProfile(),
  type: 'USER',
  userId,
  ...data,
  ...gsi1UserByAuth(data.authProvider, data.authSubject, userId),
});

export const buildCreatorItem = (creatorId: string, platform: string, data: Omit<CreatorItem, 'PK'|'SK'|'type'|'creatorId'|'platform'|'GSI2PK'|'GSI2SK'|'GSI3PK'|'GSI3SK'>): CreatorItem => ({
  PK: pkCreator(creatorId, platform),
  SK: skCreatorProfile(),
  type: 'CREATOR',
  creatorId,
  platform,
  ...data,
  ...gsi2CreatorByPlatformLast(platform, data.lastAnalyzedAt, creatorId),
  ...gsi3CreatorByPlatformCred(platform, data.credibilityRating, creatorId),
});

export const buildAnalysisItem = (
  id: string,
  userId: string,
  createdAt: number,
  data: Omit<AnalysisItem,
    'PK'|'SK'|'type'|'id'|'userId'|'createdAt'|'GSI4PK'|'GSI4SK'|'GSI5PK'|'GSI5SK'|'GSI6PK'|'GSI6SK'|'GSI7PK'|'GSI7SK'>
): AnalysisItem => {
  const item: AnalysisItem = {
    PK: pkUser(userId),
    SK: skAnalysis(createdAt, id),
    type: 'ANALYSIS',
    id,
    userId,
    createdAt,
    ...data,
    ...gsi7AnalysesByCreatedAt(createdAt, userId, id),
  };
  if (data.requiresFactCheck) Object.assign(item, gsi4AnalysesRFC(createdAt, userId, id));
  const platform = data.metadata?.platform;
  if (platform) Object.assign(item, gsi5AnalysesByUserPlatform(userId, platform, createdAt, id));
  if (data.contentCreatorCK) {
    const [_, creatorIdPart, __, platformTag, platformName] = data.contentCreatorCK.split('#');
    if (creatorIdPart && platformTag === 'PLATFORM' && platformName) {
      Object.assign(item, gsi6AnalysesByCreator(creatorIdPart.replace('CREATOR','').replace('',''), platformName, createdAt, id));
    }
  }
  return item;
};

export const buildCommentItem = (
  id: string,
  creatorId: string,
  platform: string,
  userId: string,
  createdAt: number,
  data: Omit<CommentItem, 'PK'|'SK'|'type'|'id'|'creatorId'|'platform'|'userId'|'createdAt'|'GSI8PK'|'GSI8SK'>
): CommentItem => ({
  PK: pkCreator(creatorId, platform),
  SK: skComment(createdAt, id),
  type: 'COMMENT',
  id,
  creatorId,
  platform,
  userId,
  createdAt,
  ...data,
  ...gsi8CommentsByUser(userId, createdAt, id),
});

// Minimal repo operations — put and a couple of queries to validate schema
export const putItem = async (item: UserItem | CreatorItem | AnalysisItem | CommentItem) => {
  await ddbDoc.send(new PutCommand({ TableName: TABLE, Item: item }));
};

export const getUserByAuthSubject = async (provider: 'clerk' | 'cognito', subject: string) => {
  const res = await ddbDoc.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :p',
    ExpressionAttributeValues: { ':p': `AUTH#${provider}#${subject}` },
    Limit: 1,
  }));
  return res.Items?.[0];
};

export const getUserByClerkId = (clerkId: string) => getUserByAuthSubject('clerk', clerkId);
export const getUserByCognitoSub = (sub: string) => getUserByAuthSubject('cognito', sub);

export const listAnalysesByUser = async (userId: string, limit = 20) => {
  const res = await ddbDoc.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skprefix)',
    ExpressionAttributeValues: {
      ':pk': pkUser(userId),
      ':skprefix': 'ANALYSIS#',
    },
    Limit: limit,
    ScanIndexForward: false,
  }));
  return res.Items ?? [];
};

export const listCreatorsByPlatform = async (platform: string, limit = 20) => {
  const res = await ddbDoc.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'GSI2',
    KeyConditionExpression: 'GSI2PK = :p',
    ExpressionAttributeValues: { ':p': `PLATFORM#${platform}` },
    ScanIndexForward: false,
    Limit: limit,
  }));
  return res.Items ?? [];
};
