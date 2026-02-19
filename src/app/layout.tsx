import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ThemeRegistry from '@/components/ThemeRegistry';
import AppShell from '@/components/layout/AppShell';

const inter = Inter({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700', '800'],
    display: 'swap',
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: 'PAE Contable — Sistema Contable Multi-Agente',
    description: 'Sistema de contabilidad inteligente impulsado por agentes de IA. PAE Contable automatiza la ingesta, clasificación y contabilización de documentos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" className={inter.variable}>
            <body style={{ margin: 0, backgroundColor: '#0A0E1A' }} className={inter.className}>
                <ThemeRegistry>
                    <AppShell>{children}</AppShell>
                </ThemeRegistry>
            </body>
        </html>
    );
}

