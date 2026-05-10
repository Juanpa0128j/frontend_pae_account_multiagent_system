import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const type = searchParams.get('type');
    const fallback = type === 'recovery' ? '/update-password' : '/companies';
    const next = searchParams.get('next') ?? fallback;

    if (code) {
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: { flowType: 'pkce' },
                cookies: {
                    getAll: () => cookieStore.getAll(),
                    setAll: (toSet) =>
                        toSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        ),
                },
            }
        );
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    return NextResponse.redirect(`${origin}/login?error=oauth_callback_failed`);
}
