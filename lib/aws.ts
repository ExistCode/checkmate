import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { TranscribeClient } from "@aws-sdk/client-transcribe";
import { config } from "./config";

/**
 * Centralized AWS clients with shared region from config
 */

const region = config.AWS_REGION;

/**
 * DynamoDB Document client (marshalling on by default)
 */
const ddb = new DynamoDBClient({ region });
/**
 * DynamoDB Document client (marshalling on by default)
 */
export const ddbDoc = DynamoDBDocumentClient.from(ddb, {
  marshallOptions: { removeUndefinedValues: true },
});

/**
 * S3 client
 */
export const s3 = new S3Client({ region });

/**
 * Transcribe client
 */
export const transcribe = new TranscribeClient({ region });

/**
 * Cognito IdP (for user management / token introspection)
 */
export const cognito = new CognitoIdentityProviderClient({ region });
