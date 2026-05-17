import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Stateful mock for UploadSessionContext to preserve state across setState calls
vi.stubGlobal('createStatefulMock', (initialState: any) => {
    let state = initialState;
    return {
        getState: () => state,
        setState: vi.fn((fn: (prev: any) => any) => {
            state = typeof fn === 'function' ? fn(state) : fn;
        }),
    };
});
