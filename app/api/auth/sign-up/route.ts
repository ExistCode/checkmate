import { NextResponse } from "next/server";
import { createSessionJWT, COOKIE_NAME } from "@/lib/auth";
import { upsertUser } from "@/lib/db/repo";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || typeof password !== "string") {
    return new NextResponse("Invalid body", { status: 400 });
  }
  // Persist user (id = email as stable identifier for now)
  await upsertUser({ id: email, email, username: email.split("@")[0] });
  const jwt = await createSessionJWT({ sub: email, email });
  const res = new NextResponse(null, { status: 204 });
  res.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=${jwt}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${60 * 60 * 24 * 7}`
  );
  return res;
}
