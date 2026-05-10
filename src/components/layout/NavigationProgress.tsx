'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import { palette } from '@/styles/brutalist';

export default function NavigationProgress() {
    const pathname = usePathname();
    const [visible, setVisible] = useState(false);
    const [width, setWidth] = useState(0);
    const prevPathname = useRef(pathname);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Show bar when a nav link is clicked (before pathname changes)
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = (e.target as Element).closest('a[href]');
            if (!target) return;
            const href = target.getAttribute('href');
            if (
                !href ||
                href.startsWith('http') ||
                href.startsWith('#') ||
                href.startsWith('mailto')
            )
                return;
            if (href === pathname) return;

            setVisible(true);
            setWidth(15);

            let current = 15;
            if (animRef.current) clearInterval(animRef.current);
            animRef.current = setInterval(() => {
                current = current + (85 - current) * 0.07;
                setWidth(Math.min(current, 85));
            }, 80);
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [pathname]);

    // Complete bar when pathname actually changes
    useEffect(() => {
        if (pathname === prevPathname.current) return;
        prevPathname.current = pathname;

        if (animRef.current) clearInterval(animRef.current);
        setWidth(100);

        timerRef.current = setTimeout(() => {
            setVisible(false);
            setWidth(0);
        }, 350);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [pathname]);

    if (!visible) return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                height: 2,
                zIndex: 9999,
                width: `${width}%`,
                background: palette.chartreuse,
                boxShadow: `0 0 8px ${palette.chartreuse}`,
                transition:
                    width === 100
                        ? 'width 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)'
                        : 'width 0.08s linear',
                pointerEvents: 'none',
            }}
        />
    );
}
