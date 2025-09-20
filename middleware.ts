import { NextResponse } from 'next/server';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const PUBLIC_ROUTES = [
  '/',
  '/sign-in',
  '/sign-up',
  '/auth/callback',
  '/api/transcribe',
  '/api/analyze-tiktok',
];

const isPublic = (path: string) => PUBLIC_ROUTES.some((p) => path.startsWith(p));

const region = process.env.APP_REGION || process.env.AWS_REGION;
const jwks = createRemoteJWKSet(new URL(
  `https://cognito-idp.${region}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`
));

export async function middleware(req: Request) {
  const url = new URL(req.url);
  if (isPublic(url.pathname)) return NextResponse.next();

  const bearer = req.headers.get('authorization');
  const token = bearer?.startsWith('Bearer ')
    ? bearer.slice('Bearer '.length)
    : (typeof (req as any).cookies?.get === 'function'
        ? (req as any).cookies.get('id_token')?.value || (req as any).cookies.get('access_token')?.value
        : undefined);

  if (!token) return NextResponse.redirect(new URL('/sign-in', url));

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://cognito-idp.${region}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
      audience: process.env.COGNITO_CLIENT_ID || process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    });
    const res = NextResponse.next();
    res.headers.set('x-auth-provider', 'cognito');
    res.headers.set('x-auth-subject', String(payload.sub));
    return res;
  } catch (err) {
    return NextResponse.redirect(new URL('/sign-in', url));
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
