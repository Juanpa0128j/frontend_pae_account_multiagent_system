import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Singleton to avoid "Multiple GoTrueClient instances detected" warnings and
// storage-key races when multiple components/interceptors create clients.
let cachedClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
    if (cachedClient) return cachedClient;
    cachedClient = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                flowType: 'pkce',
            },
        }
    );
    return cachedClient;
}
