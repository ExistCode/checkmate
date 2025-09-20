import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyIdToken, ID_TOKEN_COOKIE_NAME } from "@/lib/auth/cognito";

const PUBLIC_ROUTE_PATTERNS = [
  /^\/$/,
  /^\/sign-in(.*)$/,
  /^\/sign-up(.*)$/,
  /^\/api\/transcribe(.*)$/,
  /^\/api\/analyze-tiktok$/,
];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const bearerToken = req.headers.get("authorization");
  const cookieToken = req.cookies.get(ID_TOKEN_COOKIE_NAME)?.value;
  const token = bearerToken?.startsWith("Bearer ")
    ? bearerToken.replace("Bearer ", "")
    : cookieToken;

  if (!token) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  try {
    await verifyIdToken(token);
    return NextResponse.next();
  } catch (error) {
    console.error("Invalid Cognito token", error);
    const response = NextResponse.redirect(new URL("/sign-in", req.url));
    response.cookies.delete(ID_TOKEN_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
