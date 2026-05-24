'use client';

import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'pae:notifications-read-v1';

function loadFromStorage(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return new Set();
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) return new Set(parsed as string[]);
    } catch {
        // ignore parse errors
    }
    return new Set();
}

function saveToStorage(ids: Set<string>): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
    } catch {
        // ignore write errors
    }
}

export interface UseNotificationReads {
    readIds: Set<string>;
    markRead: (id: string) => void;
    markAllRead: (ids: string[]) => void;
    unreadCount: (allIds: string[]) => number;
}

export function useNotificationReads(): UseNotificationReads {
    const [readIds, setReadIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        setReadIds(loadFromStorage());
    }, []);

    const markRead = useCallback((id: string) => {
        setReadIds((prev) => {
            const next = new Set(prev);
            next.add(id);
            saveToStorage(next);
            return next;
        });
    }, []);

    const markAllRead = useCallback((ids: string[]) => {
        setReadIds((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => next.add(id));
            saveToStorage(next);
            return next;
        });
    }, []);

    const unreadCount = useCallback(
        (allIds: string[]) => allIds.filter((id) => !readIds.has(id)).length,
        [readIds]
    );

    return { readIds, markRead, markAllRead, unreadCount };
}
