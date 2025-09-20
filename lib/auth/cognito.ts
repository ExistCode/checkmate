import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { config } from "@/lib/config";

export const ID_TOKEN_COOKIE_NAME = "cognito_id_token";
export const ACCESS_TOKEN_COOKIE_NAME = "cognito_access_token";
export const REFRESH_TOKEN_COOKIE_NAME = "cognito_refresh_token";

const issuer = `https://cognito-idp.${config.AWS_REGION}.amazonaws.com/${config.COGNITO_USER_POOL_ID}`;
const jwksUri = `${issuer}/.well-known/jwks.json`;

const jwks = createRemoteJWKSet(new URL(jwksUri));

function encodeClientSecret(clientId: string, clientSecret: string) {
  const value = `${clientId}:${clientSecret}`;
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value).toString("base64");
  }
  if (typeof btoa !== "undefined") {
    return btoa(value);
  }
  throw new Error("No base64 encoder available in this runtime");
}

export interface CognitoIdTokenPayload extends JWTPayload {
  sub: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  "cognito:username"?: string;
  preferred_username?: string;
  picture?: string;
}

export async function verifyIdToken(token: string) {
  const { payload } = await jwtVerify(token, jwks, {
    audience: config.COGNITO_CLIENT_ID,
    issuer,
  });

  return payload as CognitoIdTokenPayload;
}

export function getAuthorizeUrl(state?: string) {
  const params = new URLSearchParams({
    client_id: config.COGNITO_CLIENT_ID,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: config.COGNITO_REDIRECT_URI,
  });

  if (state) {
    params.set("state", state);
  }

  return `${config.COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;
}

export function getLogoutUrl(state?: string) {
  const params = new URLSearchParams({
    client_id: config.COGNITO_CLIENT_ID,
    logout_uri: config.COGNITO_LOGOUT_REDIRECT_URI,
  });

  if (state) {
    params.set("state", state);
  }

  return `${config.COGNITO_DOMAIN}/logout?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token: string;
  expires_in: number;
  token_type: string;
}

export async function exchangeAuthorizationCode(code: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.COGNITO_CLIENT_ID,
    code,
    redirect_uri: config.COGNITO_REDIRECT_URI,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (config.COGNITO_CLIENT_SECRET) {
    const secret = encodeClientSecret(
      config.COGNITO_CLIENT_ID,
      config.COGNITO_CLIENT_SECRET
    );
    headers.Authorization = `Basic ${secret}`;
  }

  const response = await fetch(`${config.COGNITO_DOMAIN}/oauth2/token`, {
    method: "POST",
    headers,
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to exchange Cognito authorization code: ${response.status} ${errorBody}`
    );
  }

  const tokens = (await response.json()) as TokenResponse;
  return tokens;
}

export async function refreshTokens(refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: config.COGNITO_CLIENT_ID,
    refresh_token: refreshToken,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (config.COGNITO_CLIENT_SECRET) {
    const secret = encodeClientSecret(
      config.COGNITO_CLIENT_ID,
      config.COGNITO_CLIENT_SECRET
    );
    headers.Authorization = `Basic ${secret}`;
  }

  const response = await fetch(`${config.COGNITO_DOMAIN}/oauth2/token`, {
    method: "POST",
    headers,
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to refresh Cognito tokens: ${response.status} ${errorBody}`
    );
  }

  const tokens = (await response.json()) as TokenResponse;
  return tokens;
}
