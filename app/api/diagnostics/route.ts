import { NextResponse } from "next/server";

export async function GET() {
  const appRegion = process.env.APP_REGION || null;
  const cognitoRegion = process.env.COGNITO_REGION || null;
  const poolId = process.env.COGNITO_USER_POOL_ID || null;
  const clientId = process.env.COGNITO_CLIENT_ID || process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || null;
  const domain = process.env.COGNITO_DOMAIN || process.env.NEXT_PUBLIC_COGNITO_DOMAIN || null;
  const bedrockModelId = process.env.BEDROCK_MODEL_ID || null;
  const s3Bucket = process.env.S3_BUCKET || null;
  const betterAuthSecretSet = Boolean(process.env.BETTER_AUTH_SECRET);

  const issuerRegion = cognitoRegion || appRegion || null;
  const issuerUrl = issuerRegion && poolId
    ? `https://cognito-idp.${issuerRegion}.amazonaws.com/${poolId}`
    : null;

  const diagnostics = {
    runtime: {
      node: process.version,
      env: process.env.NODE_ENV,
    },
    regions: {
      appRegion,
      cognitoRegion,
      issuerRegion,
    },
    auth: {
      poolId,
      clientId,
      domain,
      issuerUrl,
      betterAuthSecretSet,
    },
    services: {
      bedrockModelId,
      s3Bucket,
    },
    presence: {
      APP_REGION: Boolean(appRegion),
      COGNITO_REGION: Boolean(cognitoRegion),
      COGNITO_USER_POOL_ID: Boolean(poolId),
      COGNITO_CLIENT_ID: Boolean(clientId),
      COGNITO_DOMAIN: Boolean(domain),
      BEDROCK_MODEL_ID: Boolean(bedrockModelId),
      S3_BUCKET: Boolean(s3Bucket),
      BETTER_AUTH_SECRET: betterAuthSecretSet,
    },
  };

  return NextResponse.json(diagnostics, { status: 200 });
}


