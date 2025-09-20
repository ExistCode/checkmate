import { headers } from 'next/headers';
import { auth } from '@clerk/nextjs/server';

export type AuthContext = {
  provider: 'clerk' | 'cognito';
  subject: string;
  userId: string; // internal app user id, here we reuse subject
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const h = headers();
  const provider = h.get('x-auth-provider') as 'clerk' | 'cognito' | null;
  const subject = h.get('x-auth-subject');
  if (provider && subject) {
    return { provider, subject, userId: subject };
  }
  // Fallback to Clerk while Cognito migration completes
  try {
    const { userId, sessionClaims } = auth();
    if (userId) {
      return { provider: 'clerk', subject: userId, userId };
    }
  } catch {}
  return null;
}

