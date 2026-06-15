import type { Metadata } from 'next';
import localFont from 'next/font/local';
import ThemeRegistry from '@/components/ThemeRegistry';
import AppShell from '@/components/layout/AppShell';
import './globals.css';

const inter = localFont({
    src: [{ path: './fonts/Inter-variable.woff2', weight: '300 800', style: 'normal' }],
    display: 'swap',
    variable: '--font-inter',
});

const bricolage = localFont({
    src: [
        { path: './fonts/BricolageGrotesque-variable.woff2', weight: '400 800', style: 'normal' },
    ],
    display: 'swap',
    variable: '--font-bricolage',
});

const jetbrains = localFont({
    src: [{ path: './fonts/JetBrainsMono-variable.woff2', weight: '400 700', style: 'normal' }],
    display: 'swap',
    variable: '--font-jetbrains',
});

export const metadata: Metadata = {
    title: 'Sistema Contable Multiagéntico',
    description:
        'Sistema de contabilidad inteligente impulsado por agentes de IA. PAE Contable automatiza la ingesta, clasificación y contabilización de documentos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" className={`${inter.variable} ${bricolage.variable} ${jetbrains.variable}`}>
            <body style={{ margin: 0, backgroundColor: '#0A0E1A' }} className={inter.className}>
                <ThemeRegistry>
                    <AppShell>{children}</AppShell>
                </ThemeRegistry>
            </body>
        </html>
    );
}
