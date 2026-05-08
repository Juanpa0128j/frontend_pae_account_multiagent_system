// ============================================================================
// Formatters — PAE Contable
// ============================================================================

/**
 * Format a number as Colombian Peso (COP) currency
 */
export function formatCOP(
    value: number,
    options?: { showSign?: boolean; compact?: boolean }
): string {
    const absValue = Math.abs(value);

    let formatted: string;

    if (options?.compact) {
        if (absValue >= 1_000_000_000) {
            formatted = `$${(absValue / 1_000_000_000).toFixed(1)}B`;
        } else if (absValue >= 1_000_000) {
            formatted = `$${(absValue / 1_000_000).toFixed(1)}M`;
        } else if (absValue >= 1_000) {
            formatted = `$${(absValue / 1_000).toFixed(0)}K`;
        } else {
            formatted = new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(absValue);
        }
    } else {
        formatted = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(absValue);
    }

    if (options?.showSign) {
        return value < 0 ? `−${formatted}` : `+${formatted}`;
    }

    return value < 0 ? `−${formatted}` : formatted;
}

/**
 * Format a date string (ISO 8601) to Colombian locale short format
 */
export function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(date);
    } catch {
        return dateStr;
    }
}

/**
 * Format a date string to full locale format
 */
export function formatDateLong(dateStr: string): string {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    } catch {
        return dateStr;
    }
}

/**
 * Format a Colombian NIT (e.g., "900123456-1")
 */
export function formatNIT(nit: string): string {
    if (!nit) return '—';
    const cleaned = nit.replace(/\D/g, '');
    if (cleaned.length <= 9) return cleaned;
    const main = cleaned.slice(0, -1);
    const digit = cleaned.slice(-1);
    // Format with dots every 3 digits from right
    const formatted = main.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formatted}-${digit}`;
}

/**
 * Format duration in milliseconds to human readable string
 */
export function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    const secs = (ms / 1000).toFixed(1);
    return `${secs}s`;
}

/**
 * Format a file size in bytes to human readable
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Returns the current Colombian fiscal period label
 */
export function currentPeriodLabel(): string {
    const now = new Date();
    const months = [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre',
    ];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

/**
 * Get ISO date string for start of current month
 */
export function startOfCurrentMonth(): string {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

/**
 * Get ISO date string for today
 */
export function today(): string {
    return new Date().toISOString().split('T')[0];
}
