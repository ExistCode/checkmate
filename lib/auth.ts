import { headers, cookies } from "next/headers";
import { jwtVerify, createRemoteJWKSet, type JWTPayload } from "jose";

export type AuthContext = {
  provider: "cognito";
  subject: string;
  userId: string; // internal app user id, here we reuse subject
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const h = await headers();
  const c = await cookies();
  const subject = h.get("x-auth-subject");
  if (subject) return { provider: "cognito", subject, userId: subject };
  // Fallback: verify Cognito JWT from Authorization header or cookies
  const bearer = h.get("authorization");
  const token = bearer?.startsWith("Bearer ")
    ? bearer.slice("Bearer ".length)
    : c.get("id_token")?.value || c.get("access_token")?.value;

  if (!token) return null;

  const region = process.env.APP_REGION || process.env.AWS_REGION;
  const poolId = process.env.COGNITO_USER_POOL_ID;
  const clientId =
    process.env.COGNITO_CLIENT_ID || process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  if (!region || !poolId || !clientId) return null;

  try {
    const issuer = `https://cognito-idp.${region}.amazonaws.com/${poolId}`;
    const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience: clientId,
    });
    const sub = String((payload as JWTPayload).sub);
    if (!sub) return null;
    return { provider: "cognito", subject: sub, userId: sub };
  } catch {
    return null;
  }
}
