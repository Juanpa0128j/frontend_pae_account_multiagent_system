'use client';

import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { NavigateNext as NavNextIcon } from '@mui/icons-material';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    breadcrumbs?: BreadcrumbItem[];
    action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, breadcrumbs, action }: PageHeaderProps) {
    const safeBreadcrumbs = (breadcrumbs || []).filter(
        (crumb): crumb is BreadcrumbItem => !!crumb && typeof crumb.label === 'string' && crumb.label.length > 0
    );

    return (
        <Box
            sx={{
                mb: 3,
                display: 'flex',
                alignItems: { sm: 'center' },
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1.5,
            }}
        >
            <Box>
                {safeBreadcrumbs.length > 0 && (
                    <Breadcrumbs
                        separator={<NavNextIcon fontSize="inherit" />}
                        sx={{ mb: 0.5, '& .MuiBreadcrumbs-separator': { color: 'text.disabled' } }}
                    >
                        {safeBreadcrumbs.map((crumb, i) =>
                            crumb.href && i < safeBreadcrumbs.length - 1 ? (
                                <MuiLink
                                    key={crumb.label}
                                    href={crumb.href}
                                    underline="hover"
                                    sx={{ fontSize: '0.78rem', color: 'text.secondary', fontWeight: 500 }}
                                >
                                    {crumb.label}
                                </MuiLink>
                            ) : (
                                <Typography
                                    key={crumb.label}
                                    sx={{ fontSize: '0.78rem', color: 'text.disabled', fontWeight: 500 }}
                                >
                                    {crumb.label}
                                </Typography>
                            )
                        )}
                    </Breadcrumbs>
                )}
                <Typography variant="h5" fontWeight={700} sx={{ color: 'text.primary', lineHeight: 1.2 }}>
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                        {subtitle}
                    </Typography>
                )}
            </Box>
            {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
        </Box>
    );
}
