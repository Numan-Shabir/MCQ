import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-change-this';
const key = new TextEncoder().encode(SECRET_KEY);

export interface SessionPayload extends JWTPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

export async function signSession(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  return await verifySession(session);
}

export async function login(userData: { id: string; email: string; role: string; name: string | null }) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await signSession(userData);

  (await cookies()).set('session', session, {
    expires,
    httpOnly: true,
    path: '/',
    sameSite: 'lax', // Use 'lax' or 'strict'
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function logout() {
  (await cookies()).set('session', '', { expires: new Date(0), path: '/' });
}
