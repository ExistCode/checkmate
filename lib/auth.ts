import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export type AuthContext = {
  provider: "local";
  subject: string;
  userId: string;
  email: string;
};

const COOKIE_NAME = "app_session";
const ISSUER = "checkmate.local";
const AUDIENCE = "checkmate.app";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "dev-insecure-secret-change";
  return new TextEncoder().encode(secret);
}

export async function createSessionJWT(payload: {
  sub: string;
  email: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const expiresIn = payload.expiresInSeconds ?? 60 * 60 * 24 * 7; // 7 days
  return await new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(payload.sub)
    .setExpirationTime(`${expiresIn}s`)
    .sign(getSecretKey());
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    const sub = String(payload.sub || "");
    const email = String((payload as any).email || "");
    if (!sub || !email) return null;
    return { provider: "local", subject: sub, userId: sub, email };
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
