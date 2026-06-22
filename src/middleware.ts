import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(['/login(.*)', '/signup(.*)']);

export default clerkMiddleware(async (auth, request) => {
    const { userId } = await auth();
    const { pathname } = request.nextUrl;
    const onPublic = isPublicRoute(request);

    // Signed-in user on the login page → send to company selection.
    if (userId && pathname.startsWith('/login')) {
        const url = request.nextUrl.clone();
        url.pathname = '/companies';
        return NextResponse.redirect(url);
    }

    // Unauthenticated user on a protected route → login.
    if (!userId && !onPublic) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
