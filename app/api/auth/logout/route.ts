import { NextResponse } from "next/server";
import {
  ID_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  getLogoutUrl,
} from "@/lib/auth/cognito";

function clearAuthCookies(response: NextResponse) {
  [
    ID_TOKEN_COOKIE_NAME,
    ACCESS_TOKEN_COOKIE_NAME,
    REFRESH_TOKEN_COOKIE_NAME,
  ].forEach((cookieName) => response.cookies.delete(cookieName));
}

export async function GET(request: Request) {
  const response = NextResponse.redirect(getLogoutUrl());
  clearAuthCookies(response);
  return response;
}

export async function POST(request: Request) {
  const response = NextResponse.redirect(getLogoutUrl());
  clearAuthCookies(response);
  return response;
}
