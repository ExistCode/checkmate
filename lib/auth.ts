import { headers } from 'next/headers';

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
  return null;
}
