import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

type ErrorHandler = (message: string) => void;

let _onError: ErrorHandler = () => {};

export function setQueryErrorHandler(handler: ErrorHandler) {
    _onError = handler;
}

function extractMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Ocurrió un error inesperado.';
}

const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error) => _onError(extractMessage(error)),
    }),
    mutationCache: new MutationCache({
        onError: (error) => _onError(extractMessage(error)),
    }),
    defaultOptions: {
        queries: {
            staleTime: 30 * 1000,
            retry: 2,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 1,
        },
    },
});

export default queryClient;
