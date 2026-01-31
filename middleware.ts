import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from './lib/auth';

const PROTECTED_ROUTES = ['/dashboard', '/exam', '/admin'];

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const isProtectedRoute = PROTECTED_ROUTES.some((route) => path.startsWith(route));

    if (isProtectedRoute) {
        const cookie = request.cookies.get('session')?.value;
        const session = cookie ? await verifySession(cookie) : null;

        if (!session) {
            return NextResponse.redirect(new URL('/login', request.nextUrl));
        }

        if (path.startsWith('/admin') && session.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
