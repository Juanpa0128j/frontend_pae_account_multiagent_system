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
};

export default nextConfig;
