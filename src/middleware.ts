import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: { flowType: 'pkce' },
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;
    const isLoginRoute = pathname === '/login' || pathname.startsWith('/login/');
    const isUpdatePasswordRoute = pathname.startsWith('/update-password');
    const isForgotPasswordRoute = pathname.startsWith('/forgot-password');
    const isAuthRoute = isLoginRoute || isUpdatePasswordRoute || isForgotPasswordRoute;
    const isCallbackRoute = pathname.startsWith('/auth/callback');

    if (isCallbackRoute) {
        return supabaseResponse;
    }

    if (!user && !isAuthRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    if (user && isLoginRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/companies';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
