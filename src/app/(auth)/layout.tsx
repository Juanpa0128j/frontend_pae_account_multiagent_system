export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                minHeight: '100vh',
                width: '100%',
                backgroundColor: '#0A0E1A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter, sans-serif',
            }}
        >
            {children}
        </div>
    );
}
