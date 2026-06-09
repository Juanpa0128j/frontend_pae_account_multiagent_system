/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Tree-shake MUI and other large barrel imports.
    // Without this, importing { Box, Typography } from '@mui/material' pulls
    // the entire library through the resolver and Next has to compile ~3000
    // modules for every route. With it, only the components we actually use
    // are walked, dropping cold-compile time substantially in dev.
    experimental: {
        optimizePackageImports: [
            '@mui/material',
            '@mui/icons-material',
            '@mui/lab',
            '@mui/x-data-grid',
            '@mui/x-date-pickers',
            'date-fns',
            'lodash',
            '@tanstack/react-query',
        ],
    },

    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' http://localhost:8000 https://pae-backend-trht.onrender.com https://*.supabase.co https://api.openai.com https://api.gemini.com https://api.groq.com; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
                    },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload',
                    },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                ],
            },
        ];
    },
};

export default nextConfig;
