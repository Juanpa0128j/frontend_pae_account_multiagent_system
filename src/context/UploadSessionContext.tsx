'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { FileUploadState } from '@/types';
import type { FinancialStatementResponse } from '@/lib/api';
import type { ViaBSlot } from '@/hooks/useUpload';
import { useCompany } from '@/context/CompanyContext';

const VIA_B_SLOTS_INIT: ViaBSlot[] = [
    {
        docType: 'balance_general',
        label: 'Balance General',
        file: null,
        status: 'idle',
        progress: 0,
        parser_mode: 'fast',
    },
    {
        docType: 'estado_resultados',
        label: 'Estado de Resultados',
        file: null,
        status: 'idle',
        progress: 0,
        parser_mode: 'fast',
    },
    {
        docType: 'libro_auxiliar',
        label: 'Libro Auxiliar',
        file: null,
        status: 'idle',
        progress: 0,
        parser_mode: 'fast',
    },
    {
        docType: 'balance_general_anterior',
        label: 'Balance General anterior',
        file: null,
        status: 'idle',
        progress: 0,
        parser_mode: 'fast',
    },
];

const STORAGE_KEY = 'pae:upload-session-v1';
const NO_COMPANY = '__no_company__';

interface CompanySessionState {
    viaAFiles: FileUploadState[];
    viaBSlots: ViaBSlot[];
    isPollingDerived: boolean;
    derivedStatements: FinancialStatementResponse[];
    derivedError: string | null;
    uploadMode: 'via-a' | 'via-b';
}

type SessionsByCompany = Record<string, CompanySessionState>;

function initialCompanyState(): CompanySessionState {
    return {
        viaAFiles: [],
        viaBSlots: VIA_B_SLOTS_INIT,
        isPollingDerived: false,
        derivedStatements: [],
        derivedError: null,
        uploadMode: 'via-a',
    };
}

/**
 * File objects (Blob) cannot be revived from localStorage. We strip them on
 * read so a refresh shows the in-flight job by id/status but does not pretend
 * to still hold the binary. The pipeline lives server-side anyway — polling
 * by ingest_id / process_id resumes from wherever the backend is.
 */
function reviveSessions(raw: string | null): SessionsByCompany {
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw) as SessionsByCompany;
        if (!parsed || typeof parsed !== 'object') return {};
        const out: SessionsByCompany = {};
        for (const [nit, session] of Object.entries(parsed)) {
            const base = { ...initialCompanyState(), ...session };
            // Blobs can't be revived from localStorage. An in-flight job
            // (uploading/extracting/processing) whose blob is gone and that
            // has no server-side handle (ingest_id/process_id) can never
            // resume — it would render as a stuck "archivo · 0 B" zombie.
            // Drop those; keep terminal states and anything resumable by id.
            base.viaAFiles = (session.viaAFiles ?? [])
                .filter((f) => {
                    const inFlight =
                        f.status === 'uploading' ||
                        f.status === 'extracting' ||
                        f.status === 'processing';
                    if (!inFlight) return true;
                    return Boolean(f.ingest_id || f.process_id);
                })
                .map((f) => ({
                    ...f,
                    file: null as unknown as File,
                    files: undefined,
                }));
            base.viaBSlots = (session.viaBSlots ?? VIA_B_SLOTS_INIT).map((slot) => ({
                ...slot,
                file: null,
            }));
            out[nit] = base;
        }
        return out;
    } catch {
        return {};
    }
}

function stripBlobsForStorage(sessions: SessionsByCompany): SessionsByCompany {
    const out: SessionsByCompany = {};
    for (const [nit, session] of Object.entries(sessions)) {
        out[nit] = {
            ...session,
            viaAFiles: session.viaAFiles.map((f) => {
                // Persist display metadata before dropping the blob so a
                // reloaded terminal job still shows its real name and size
                // (otherwise it renders as "archivo · 0 B").
                const sourceFiles = f.files ?? (f.file ? [f.file] : []);
                const display_name =
                    f.display_name ?? f.file_names?.[0] ?? f.file?.name ?? sourceFiles[0]?.name;
                const display_size =
                    f.display_size ?? sourceFiles.reduce((sum, c) => sum + (c?.size ?? 0), 0);
                return {
                    ...f,
                    display_name,
                    display_size,
                    file: null as unknown as File,
                    files: undefined,
                };
            }),
            viaBSlots: session.viaBSlots.map((slot) => ({ ...slot, file: null })),
        };
    }
    return out;
}

interface UploadSessionContextValue {
    viaAFiles: FileUploadState[];
    setViaAFiles: Dispatch<SetStateAction<FileUploadState[]>>;
    viaBSlots: ViaBSlot[];
    setViaBSlots: Dispatch<SetStateAction<ViaBSlot[]>>;
    isPollingDerived: boolean;
    setIsPollingDerived: Dispatch<SetStateAction<boolean>>;
    derivedStatements: FinancialStatementResponse[];
    setDerivedStatements: Dispatch<SetStateAction<FinancialStatementResponse[]>>;
    derivedError: string | null;
    setDerivedError: Dispatch<SetStateAction<string | null>>;
    uploadMode: 'via-a' | 'via-b';
    setUploadMode: Dispatch<SetStateAction<'via-a' | 'via-b'>>;
}

const UploadSessionContext = createContext<UploadSessionContextValue | null>(null);

export function UploadSessionProvider({ children }: { children: React.ReactNode }) {
    const { activeNit } = useCompany();
    const activeKey = activeNit ?? NO_COMPANY;

    const [sessions, setSessions] = useState<SessionsByCompany>(() => {
        if (typeof window === 'undefined') return {};
        return reviveSessions(window.localStorage.getItem(STORAGE_KEY));
    });

    // Persist on every change. Blobs stripped before write.
    const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (persistTimer.current) clearTimeout(persistTimer.current);
        persistTimer.current = setTimeout(() => {
            try {
                window.localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(stripBlobsForStorage(sessions))
                );
            } catch {
                // localStorage may be full / disabled — ignore.
            }
        }, 250);
        return () => {
            if (persistTimer.current) clearTimeout(persistTimer.current);
        };
    }, [sessions]);

    const current = sessions[activeKey] ?? initialCompanyState();

    const updateCurrent = useCallback(
        (patch: Partial<CompanySessionState>) => {
            setSessions((prev) => {
                const existing = prev[activeKey] ?? initialCompanyState();
                return {
                    ...prev,
                    [activeKey]: { ...existing, ...patch },
                };
            });
        },
        [activeKey]
    );

    const makeSetter = useCallback(
        <K extends keyof CompanySessionState>(
            key: K
        ): Dispatch<SetStateAction<CompanySessionState[K]>> =>
            (valueOrUpdater) => {
                setSessions((prev) => {
                    const existing = prev[activeKey] ?? initialCompanyState();
                    const nextValue =
                        typeof valueOrUpdater === 'function'
                            ? (
                                  valueOrUpdater as (
                                      v: CompanySessionState[K]
                                  ) => CompanySessionState[K]
                              )(existing[key])
                            : valueOrUpdater;
                    return {
                        ...prev,
                        [activeKey]: { ...existing, [key]: nextValue },
                    };
                });
            },
        [activeKey]
    );

    const setViaAFiles = useMemo(() => makeSetter('viaAFiles'), [makeSetter]);
    const setViaBSlots = useMemo(() => makeSetter('viaBSlots'), [makeSetter]);
    const setIsPollingDerived = useMemo(() => makeSetter('isPollingDerived'), [makeSetter]);
    const setDerivedStatements = useMemo(() => makeSetter('derivedStatements'), [makeSetter]);
    const setDerivedError = useMemo(() => makeSetter('derivedError'), [makeSetter]);
    const setUploadMode = useMemo(() => makeSetter('uploadMode'), [makeSetter]);

    // Ensure new companies get an entry on first switch, so polling/state holds.
    const seededRef = useRef<Set<string>>(new Set());
    useEffect(() => {
        if (seededRef.current.has(activeKey)) return;
        seededRef.current.add(activeKey);
        if (!sessions[activeKey]) {
            updateCurrent({});
        }
    }, [activeKey, sessions, updateCurrent]);

    return (
        <UploadSessionContext.Provider
            value={{
                viaAFiles: current.viaAFiles,
                setViaAFiles,
                viaBSlots: current.viaBSlots,
                setViaBSlots,
                isPollingDerived: current.isPollingDerived,
                setIsPollingDerived,
                derivedStatements: current.derivedStatements,
                setDerivedStatements,
                derivedError: current.derivedError,
                setDerivedError,
                uploadMode: current.uploadMode,
                setUploadMode,
            }}
        >
            {children}
        </UploadSessionContext.Provider>
    );
}

export function useUploadSession(): UploadSessionContextValue {
    const ctx = useContext(UploadSessionContext);
    if (!ctx) {
        throw new Error('useUploadSession must be used inside UploadSessionProvider');
    }
    return ctx;
}
