'use client';

import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { usePucList } from '@/hooks/usePuc';
import { palette, fonts } from '@/styles/brutalist';
import type { CuentaPUC } from '@/types';

interface PucAutocompleteProps {
    value?: string;
    onChange?: (codigo: string) => void;
    companyNit?: string | null;
}

export default function PucAutocomplete({ value, onChange, companyNit }: PucAutocompleteProps) {
    const [inputValue, setInputValue] = useState(value ?? '');
    const [search, setSearch] = useState('');

    // Debounce: update search ≥300ms after input change
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(inputValue);
        }, 300);
        return () => clearTimeout(timer);
    }, [inputValue]);

    const { data: options = [], isLoading } = usePucList(
        search
            ? {
                  search,
                  company_nit: companyNit ?? undefined,
              }
            : undefined
    );

    return (
        <Autocomplete<CuentaPUC, false, false, true>
            freeSolo
            options={options}
            loading={isLoading}
            inputValue={inputValue}
            getOptionLabel={(opt) =>
                typeof opt === 'string' ? opt : `${opt.codigo} — ${opt.descripcion ?? opt.nombre}`
            }
            isOptionEqualToValue={(opt, val) =>
                typeof val === 'string' ? opt.codigo === val : opt.codigo === val.codigo
            }
            onInputChange={(_, val, reason) => {
                if (reason === 'input') setInputValue(val);
            }}
            onChange={(_, selected) => {
                if (selected && typeof selected !== 'string') {
                    onChange?.(selected.codigo);
                    setInputValue(selected.codigo);
                } else if (typeof selected === 'string') {
                    onChange?.(selected);
                    setInputValue(selected);
                }
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    size="small"
                    placeholder="Código PUC"
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {isLoading ? <CircularProgress size={12} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                    sx={{
                        '& .MuiInputBase-root': {
                            background: '#1a1a1a',
                            fontFamily: fonts.mono,
                            fontSize: '0.75rem',
                            color: palette.paper,
                            border: `1px solid rgba(255,255,255,0.08)`,
                            borderRadius: 0,
                            '&:hover': { borderColor: 'rgba(255,255,255,0.2)' },
                            '&.Mui-focused': { borderColor: palette.accent },
                        },
                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        '& input': { color: palette.paper, fontFamily: fonts.mono },
                    }}
                />
            )}
            componentsProps={{
                paper: {
                    sx: {
                        background: '#1a1a1a',
                        border: `1px solid rgba(255,255,255,0.12)`,
                        borderRadius: 0,
                        fontFamily: fonts.mono,
                        fontSize: '0.75rem',
                        color: palette.paper,
                    },
                },
            }}
            sx={{ width: '100%' }}
        />
    );
}
