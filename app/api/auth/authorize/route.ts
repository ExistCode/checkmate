import { NextResponse } from "next/server";
import { getAuthorizeUrl } from "@/lib/auth/cognito";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirect = url.searchParams.get("redirect");
  const authorizeUrl = getAuthorizeUrl(redirect || undefined);
  return NextResponse.json({ url: authorizeUrl });
}
