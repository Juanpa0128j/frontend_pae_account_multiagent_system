'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
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
    },
    {
        docType: 'estado_resultados',
        label: 'Estado de Resultados',
        file: null,
        status: 'idle',
        progress: 0,
    },
    { docType: 'libro_auxiliar', label: 'Libro Auxiliar', file: null, status: 'idle', progress: 0 },
];

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
    const [viaAFiles, setViaAFiles] = useState<FileUploadState[]>([]);
    const [viaBSlots, setViaBSlots] = useState<ViaBSlot[]>(VIA_B_SLOTS_INIT);
    const [isPollingDerived, setIsPollingDerived] = useState(false);
    const [derivedStatements, setDerivedStatements] = useState<FinancialStatementResponse[]>([]);
    const [derivedError, setDerivedError] = useState<string | null>(null);
    const [uploadMode, setUploadMode] = useState<'via-a' | 'via-b'>('via-a');

    // When the active company changes, drop the current upload session so we
    // never show the previous tenant's slots/files to a freshly-switched user.
    const { activeNit } = useCompany();
    const prevNitRef = useRef<string | null | undefined>(undefined);
    useEffect(() => {
        if (prevNitRef.current === undefined) {
            prevNitRef.current = activeNit;
            return;
        }
        if (prevNitRef.current !== activeNit) {
            setViaAFiles([]);
            setViaBSlots(VIA_B_SLOTS_INIT);
            setIsPollingDerived(false);
            setDerivedStatements([]);
            setDerivedError(null);
            prevNitRef.current = activeNit;
        }
    }, [activeNit]);

    return (
        <UploadSessionContext.Provider
            value={{
                viaAFiles,
                setViaAFiles,
                viaBSlots,
                setViaBSlots,
                isPollingDerived,
                setIsPollingDerived,
                derivedStatements,
                setDerivedStatements,
                derivedError,
                setDerivedError,
                uploadMode,
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
