'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from '@mui/material';
import {
  AccountBalance as BalanceIcon,
  TrendingUp as PnlIcon,
  Savings as CashIcon,
  Receipt as TaxIcon,
  Analytics as RatiosIcon,
  Leaderboard as TopIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import type { FinancialDataCard as DataCardType } from '@/types';

const CARD_ICONS: Record<string, React.ReactNode> = {
  balance: <BalanceIcon sx={{ fontSize: 18 }} />,
  pnl: <PnlIcon sx={{ fontSize: 18 }} />,
  cashflow: <CashIcon sx={{ fontSize: 18 }} />,
  iva: <TaxIcon sx={{ fontSize: 18 }} />,
  withholdings: <TaxIcon sx={{ fontSize: 18 }} />,
  ratios: <RatiosIcon sx={{ fontSize: 18 }} />,
  top_accounts: <TopIcon sx={{ fontSize: 18 }} />,
  dashboard: <DashboardIcon sx={{ fontSize: 18 }} />,
  analysis: <RatiosIcon sx={{ fontSize: 18 }} />,
};

function formatCOP(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

function renderBalanceData(data: Record<string, any>) {
  return (
    <Table size="small">
      <TableBody>
        <TableRow>
          <TableCell sx={{ color: 'text.secondary', border: 0, py: 0.5 }}>Activos</TableCell>
          <TableCell align="right" sx={{ color: '#10B981', fontWeight: 600, border: 0, py: 0.5 }}>{formatCOP(data.activos)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell sx={{ color: 'text.secondary', border: 0, py: 0.5 }}>Pasivos</TableCell>
          <TableCell align="right" sx={{ color: '#EF4444', fontWeight: 600, border: 0, py: 0.5 }}>{formatCOP(data.pasivos)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell sx={{ color: 'text.secondary', border: 0, py: 0.5 }}>Patrimonio</TableCell>
          <TableCell align="right" sx={{ color: '#6366F1', fontWeight: 600, border: 0, py: 0.5 }}>{formatCOP(data.patrimonio_total)}</TableCell>
        </TableRow>
        {data.cuadre !== undefined && (
          <TableRow>
            <TableCell sx={{ color: 'text.secondary', border: 0, py: 0.5 }}>Cuadre</TableCell>
            <TableCell align="right" sx={{ border: 0, py: 0.5 }}>
              <Chip label={data.cuadre ? 'OK' : 'Descuadre'} size="small" color={data.cuadre ? 'success' : 'error'} sx={{ fontSize: '0.65rem', height: 20 }} />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function renderPnlData(data: Record<string, any>) {
  return (
    <Table size="small">
      <TableBody>
        <TableRow>
          <TableCell sx={{ color: 'text.secondary', border: 0, py: 0.5 }}>Ingresos</TableCell>
          <TableCell align="right" sx={{ color: '#10B981', fontWeight: 600, border: 0, py: 0.5 }}>{formatCOP(data.total_ingresos)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell sx={{ color: 'text.secondary', border: 0, py: 0.5 }}>Costo ventas</TableCell>
          <TableCell align="right" sx={{ color: '#F59E0B', fontWeight: 600, border: 0, py: 0.5 }}>{formatCOP(data.total_costo_ventas)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell sx={{ color: 'text.secondary', border: 0, py: 0.5 }}>Gastos</TableCell>
          <TableCell align="right" sx={{ color: '#EF4444', fontWeight: 600, border: 0, py: 0.5 }}>{formatCOP(data.total_gastos)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell sx={{ color: 'text.secondary', fontWeight: 600, border: 0, py: 0.5 }}>Utilidad neta</TableCell>
          <TableCell align="right" sx={{ color: data.utilidad_neta >= 0 ? '#10B981' : '#EF4444', fontWeight: 700, border: 0, py: 0.5 }}>{formatCOP(data.utilidad_neta)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

function renderIvaData(data: Record<string, any>) {
  return (
    <Table size="small">
      <TableBody>
        <TableRow>
          <TableCell sx={{ color: 'text.secondary', border: 0, py: 0.5 }}>IVA Generado</TableCell>
          <TableCell align="right" sx={{ fontWeight: 600, border: 0, py: 0.5 }}>{formatCOP(data.iva_generado)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell sx={{ color: 'text.secondary', border: 0, py: 0.5 }}>IVA Descontable</TableCell>
          <TableCell align="right" sx={{ fontWeight: 600, border: 0, py: 0.5 }}>{formatCOP(data.iva_descontable)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell sx={{ color: 'text.secondary', fontWeight: 600, border: 0, py: 0.5 }}>A Pagar</TableCell>
          <TableCell align="right" sx={{ color: data.iva_a_pagar > 0 ? '#EF4444' : '#10B981', fontWeight: 700, border: 0, py: 0.5 }}>{formatCOP(data.iva_a_pagar)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

function renderRatiosData(data: Record<string, any>) {
  const ratios = [
    { label: 'Razón corriente', value: data.razon_corriente, fmt: (v: number) => v?.toFixed(2), good: (v: number) => v > 1.5 },
    { label: 'Prueba ácida', value: data.prueba_acida, fmt: (v: number) => v?.toFixed(2), good: (v: number) => v > 1.0 },
    { label: 'Margen neto', value: data.margen_neto, fmt: (v: number) => `${v?.toFixed(1)}%`, good: (v: number) => v > 0 },
    { label: 'ROA', value: data.roa, fmt: (v: number) => `${v?.toFixed(1)}%`, good: (v: number) => v > 0 },
    { label: 'Endeudamiento', value: data.razon_endeudamiento, fmt: (v: number) => formatPercent(v), good: (v: number) => v < 0.7 },
  ];

  return (
    <Table size="small">
      <TableBody>
        {ratios.map((r) => (
          <TableRow key={r.label}>
            <TableCell sx={{ color: 'text.secondary', border: 0, py: 0.5 }}>{r.label}</TableCell>
            <TableCell
              align="right"
              sx={{
                fontWeight: 600,
                border: 0,
                py: 0.5,
                color: r.value != null ? (r.good(r.value) ? '#10B981' : '#F59E0B') : 'text.disabled',
              }}
            >
              {r.value != null ? r.fmt(r.value) : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function renderGenericData(data: Record<string, any>) {
  const entries = Object.entries(data).filter(
    ([, v]) => typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean'
  );
  if (entries.length === 0) return null;

  return (
    <Table size="small">
      <TableBody>
        {entries.slice(0, 8).map(([key, value]) => (
          <TableRow key={key}>
            <TableCell sx={{ color: 'text.secondary', border: 0, py: 0.5, fontSize: '0.75rem' }}>
              {key.replace(/_/g, ' ')}
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, border: 0, py: 0.5, fontSize: '0.75rem' }}>
              {typeof value === 'number' ? formatCOP(value) : String(value)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

interface FinancialDataCardProps {
  card: DataCardType;
}

export default function FinancialDataCard({ card }: FinancialDataCardProps) {
  const icon = CARD_ICONS[card.card_type] || <DashboardIcon sx={{ fontSize: 18 }} />;

  const renderers: Record<string, (data: Record<string, any>) => React.ReactNode> = {
    balance: renderBalanceData,
    pnl: renderPnlData,
    iva: renderIvaData,
    ratios: renderRatiosData,
  };

  const renderFn = renderers[card.card_type] || renderGenericData;

  return (
    <Card
      sx={{
        bgcolor: '#0F1629',
        border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1,
          bgcolor: 'rgba(99,102,241,0.08)',
          borderBottom: '1px solid rgba(99,102,241,0.1)',
        }}
      >
        <Box sx={{ color: 'primary.light' }}>{icon}</Box>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.light', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {card.title}
        </Typography>
      </Box>
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        {renderFn(card.data)}
      </CardContent>
    </Card>
  );
}
