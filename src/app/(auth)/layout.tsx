export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es">
            <body
                style={{
                    margin: 0,
                    minHeight: '100vh',
                    backgroundColor: '#0A0E1A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Inter, sans-serif',
                }}
            >
                {children}
            </body>
        </html>
    );
}
