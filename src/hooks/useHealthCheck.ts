import { useQuery } from '@tanstack/react-query';
import { getHealthStatus } from '@/lib/api';

interface HealthStatus {
    status: 'ok' | 'degraded' | 'offline';
    agents_available: boolean;
    vector_db_connected?: boolean;
}

export function useHealthCheck() {
    return useQuery<HealthStatus>({
        queryKey: ['health'],
        queryFn: async () => {
            try {
                const raw = await getHealthStatus();
                // Backend returns {"status":"healthy"} — normalise to our internal type
                const normalized: HealthStatus = {
                    ...raw,
                    agents_available: raw.status === 'healthy' || raw.status === 'ok',
                    status:
                        raw.status === 'ok' || raw.status === 'healthy'
                            ? 'ok'
                            : raw.status === 'degraded'
                              ? 'degraded'
                              : 'offline',
                };
                return normalized;
            } catch {
                return { status: 'offline', agents_available: false };
            }
        },
        staleTime: 30_000,
        refetchInterval: 60_000,
        retry: false,
    });
}
