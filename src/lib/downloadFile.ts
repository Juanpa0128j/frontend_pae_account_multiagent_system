/**
 * Browser download utilities.
 * All functions trigger an immediate file download in the user's browser.
 */

export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }, 0);
}

export function downloadJson(data: unknown, filename: string): void {
    downloadBlob(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
        filename
    );
}

export function downloadCsv(content: string, filename: string): void {
    downloadBlob(new Blob([content], { type: 'text/csv;charset=utf-8;' }), filename);
}
