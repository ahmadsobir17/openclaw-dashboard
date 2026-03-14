import { NextAuthOptions, getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getSession(req: any) {
  return await getServerSession(authOptions);
}

export async function requireAuth(req: any) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return {
      session: null,
      error: new Error('Unauthorized'),
      status: 401,
    };
  }
  return { session, error: null, status: 200 };
}
