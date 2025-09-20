import { CognitoJwtVerifier } from "aws-jwt-verify";
import { config } from "@/lib/config";

export const ID_TOKEN_COOKIE_NAME = "cognito_id_token";
export const ACCESS_TOKEN_COOKIE_NAME = "cognito_access_token";
export const REFRESH_TOKEN_COOKIE_NAME = "cognito_refresh_token";

const idTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: config.COGNITO_USER_POOL_ID,
  tokenUse: "id",
  clientId: config.COGNITO_CLIENT_ID,
});

export type CognitoIdTokenPayload = Awaited<
  ReturnType<typeof idTokenVerifier.verify>
>;

export async function verifyIdToken(token: string) {
  return idTokenVerifier.verify(token);
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
    const secret = Buffer.from(
      `${config.COGNITO_CLIENT_ID}:${config.COGNITO_CLIENT_SECRET}`
    ).toString("base64");
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
    const secret = Buffer.from(
      `${config.COGNITO_CLIENT_ID}:${config.COGNITO_CLIENT_SECRET}`
    ).toString("base64");
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
