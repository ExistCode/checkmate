import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ID_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  refreshTokens,
  verifyIdToken,
} from "@/lib/auth/cognito";
import type { CognitoIdTokenPayload } from "@/lib/auth/cognito";
import { isProduction } from "@/lib/config";

const SECURE_COOKIE = isProduction;

function mapUser(payload: CognitoIdTokenPayload) {
  return {
    id: payload.sub,
    email: payload.email ?? null,
    firstName: payload.given_name ?? null,
    lastName: payload.family_name ?? null,
    username:
      payload["cognito:username"] ?? payload.preferred_username ?? null,
    imageUrl: payload.picture ?? null,
  };
}

function applyTokensToResponse(
  response: NextResponse,
  idToken: string,
  accessToken: string,
  refreshToken?: string,
  expiresIn?: number
) {
  if (idToken) {
    response.cookies.set({
      name: ID_TOKEN_COOKIE_NAME,
      value: idToken,
      httpOnly: false,
      secure: SECURE_COOKIE,
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn ?? 3600,
    });
  }

  if (accessToken) {
    response.cookies.set({
      name: ACCESS_TOKEN_COOKIE_NAME,
      value: accessToken,
      httpOnly: true,
      secure: SECURE_COOKIE,
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn ?? 3600,
    });
  }

  if (refreshToken) {
    response.cookies.set({
      name: REFRESH_TOKEN_COOKIE_NAME,
      value: refreshToken,
      httpOnly: true,
      secure: SECURE_COOKIE,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}

export async function GET() {
  const cookieStore = cookies();
  const idToken = cookieStore.get(ID_TOKEN_COOKIE_NAME)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

  if (!idToken && !refreshToken) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  if (idToken) {
    try {
      const payload = await verifyIdToken(idToken);
      return NextResponse.json({ user: mapUser(payload) });
    } catch (error) {
      console.warn("Stored Cognito id token invalid, attempting refresh", error);
    }
  }

  if (!refreshToken) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const tokens = await refreshTokens(refreshToken);
    const payload = await verifyIdToken(tokens.id_token);
    const response = NextResponse.json({ user: mapUser(payload) });
    applyTokensToResponse(
      response,
      tokens.id_token,
      tokens.access_token,
      tokens.refresh_token ?? refreshToken,
      tokens.expires_in
    );
    return response;
  } catch (error) {
    console.error("Failed to refresh Cognito session", error);
    const response = NextResponse.json({ user: null }, { status: 401 });
    [
      ID_TOKEN_COOKIE_NAME,
      ACCESS_TOKEN_COOKIE_NAME,
      REFRESH_TOKEN_COOKIE_NAME,
    ].forEach((name) => response.cookies.delete(name));
    return response;
  }
}
