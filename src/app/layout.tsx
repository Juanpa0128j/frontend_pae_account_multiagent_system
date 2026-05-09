import type { Metadata } from 'next';
import { Inter, Bricolage_Grotesque, JetBrains_Mono } from 'next/font/google';
import ThemeRegistry from '@/components/ThemeRegistry';
import AppShell from '@/components/layout/AppShell';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700', '800'],
    display: 'swap',
    variable: '--font-inter',
});

const bricolage = Bricolage_Grotesque({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    display: 'swap',
    variable: '--font-bricolage',
});

const jetbrains = JetBrains_Mono({
    subsets: ['latin'],
    weight: ['400', '500', '700'],
    display: 'swap',
    variable: '--font-jetbrains',
});

export const metadata: Metadata = {
    title: 'PAE Contable — Sistema Contable Multi-Agente',
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
