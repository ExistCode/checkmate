import { NextResponse } from "next/server";
import {
  exchangeAuthorizationCode,
  ID_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from "@/lib/auth/cognito";
import { isProduction } from "@/lib/config";

const SECURE_COOKIE = isProduction;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  const redirectTo = url.searchParams.get("state") || "/";

  if (error) {
    return NextResponse.redirect(new URL(`/sign-in?error=${error}`, url.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=missing_code", url.origin));
  }

  try {
    const tokens = await exchangeAuthorizationCode(code);

    const response = NextResponse.redirect(new URL(redirectTo, url.origin));

    response.cookies.set({
      name: ID_TOKEN_COOKIE_NAME,
      value: tokens.id_token,
      httpOnly: false,
      secure: SECURE_COOKIE,
      sameSite: "lax",
      path: "/",
      maxAge: tokens.expires_in,
    });

    response.cookies.set({
      name: ACCESS_TOKEN_COOKIE_NAME,
      value: tokens.access_token,
      httpOnly: true,
      secure: SECURE_COOKIE,
      sameSite: "lax",
      path: "/",
      maxAge: tokens.expires_in,
    });

    if (tokens.refresh_token) {
      response.cookies.set({
        name: REFRESH_TOKEN_COOKIE_NAME,
        value: tokens.refresh_token,
        httpOnly: true,
        secure: SECURE_COOKIE,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;
  } catch (exchangeError) {
    console.error("Failed to exchange Cognito code", exchangeError);
    return NextResponse.redirect(
      new URL("/sign-in?error=token_exchange_failed", url.origin)
    );
  }
}
