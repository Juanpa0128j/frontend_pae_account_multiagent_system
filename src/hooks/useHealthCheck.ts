import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

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
                // Backend exposes health at /health (root), not /api/v1/health
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/health`,
                    { timeout: 5000 }
                );
                const raw = response.data;
                // Backend returns {"status":"healthy"} — normalise to our internal type
                const normalized: HealthStatus = {
                    ...raw,
                    status:
                        raw.status === 'ok' || raw.status === 'healthy' ? 'ok' :
                        raw.status === 'degraded' ? 'degraded' :
                        'offline',
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
