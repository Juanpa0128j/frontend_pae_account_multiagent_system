'use client';

import { Box, Tabs, Tab } from '@mui/material';
import { palette, fonts, motion } from '@/styles/brutalist';

export type TaxTabValue = 'summary' | 'declarations' | 'calendar' | 'certificates' | 'exogena';

interface TaxTabsProps {
    value: TaxTabValue;
    onChange: (value: TaxTabValue) => void;
}

const TABS: { value: TaxTabValue; label: string }[] = [
    { value: 'summary', label: 'Resumen' },
    { value: 'declarations', label: 'Declaraciones' },
    { value: 'calendar', label: 'Calendario' },
    { value: 'certificates', label: 'Certificados' },
    { value: 'exogena', label: 'Exógena' },
];

export default function TaxTabs({ value, onChange }: TaxTabsProps) {
    return (
        <Box
            sx={{
                borderBottom: `1px solid ${palette.line}`,
                mb: 3,
            }}
        >
            <Tabs
                value={value}
                onChange={(_, newValue) => onChange(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                    '& .MuiTabs-flexContainer': {
                        gap: 1,
                    },
                    '& .MuiTabs-indicator': {
                        bgcolor: palette.accent,
                        height: 2,
                    },
                    '& .MuiTab-root': {
                        color: palette.paperMuted,
                        fontFamily: fonts.mono,
                        fontSize: '0.75rem',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        minWidth: 100,
                        py: 2,
                        transition: `color ${motion.duration.md} ${motion.snap}`,
                        '&:hover': {
                            color: palette.paper,
                        },
                        '&.Mui-selected': {
                            color: palette.accent,
                        },
                    },
                }}
            >
                {TABS.map((tab) => (
                    <Tab key={tab.value} value={tab.value} label={tab.label} />
                ))}
            </Tabs>
        </Box>
    );
}
