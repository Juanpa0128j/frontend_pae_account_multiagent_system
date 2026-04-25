/**
 * Generates the PAE Contable user manual as a PDF using jsPDF.
 * Lazy-loaded so jsPDF (~150KB) only enters the bundle when the user clicks download.
 */

import type { HelpSection, HelpStep } from './helpData';

// Brand palette
const COLORS = {
    ink: '#0A0E1A',
    text: '#1F2937',
    soft: '#4B5563',
    muted: '#6B7280',
    light: '#9CA3AF',
    line: '#E5E7EB',
    bg: '#F3F4F6',
    accent: '#6366F1',
    warningBg: '#FFFBEB',
    warningBorder: '#FCD34D',
    warningText: '#78350F',
    warningLabel: '#D97706',
};

const PAGE = {
    width: 210, // A4 width in mm
    height: 297,
    marginX: 18,
    marginTop: 22,
    marginBottom: 22,
};

const CONTENT_W = PAGE.width - PAGE.marginX * 2;

// hex string -> [r, g, b] tuple expected by jsPDF
function hexToRgb(hex: string): [number, number, number] {
    const m = hex.replace('#', '');
    const v = parseInt(m, 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export async function generateManualPDF(sections: HelpSection[]): Promise<Blob> {
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = PAGE.marginTop;

    const newPage = () => {
        doc.addPage();
        y = PAGE.marginTop;
    };

    const ensureSpace = (needed: number) => {
        if (y + needed > PAGE.height - PAGE.marginBottom) newPage();
    };

    const setColor = (color: string) => doc.setTextColor(...hexToRgb(color));
    const setFill = (color: string) => doc.setFillColor(...hexToRgb(color));
    const setDraw = (color: string) => doc.setDrawColor(...hexToRgb(color));

    // -----------------------------------------------------------------------
    // PAGE 1 — COVER
    // -----------------------------------------------------------------------
    setColor(COLORS.accent);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('PAE CONTABLE  ·  MANUAL_v0.1', PAGE.marginX, 28);

    setColor(COLORS.ink);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(64);
    doc.text('Cómo usar', PAGE.marginX, 70);
    doc.text('esto.', PAGE.marginX, 95);

    setColor(COLORS.soft);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    const leadeLines = doc.splitTextToSize(
        'Sistema multiagente contable para Colombia. Manual de usuario completo con los ' +
            sections.length +
            ' módulos de la aplicación: empresa activa, dashboard, ingesta de documentos (Via A y Via B), transacciones, libros contables, reportes financieros, módulo tributario y troubleshooting.',
        CONTENT_W
    );
    doc.text(leadeLines, PAGE.marginX, 115);

    // Stats row
    setDraw(COLORS.line);
    doc.setLineWidth(0.2);
    doc.line(PAGE.marginX, 200, PAGE.width - PAGE.marginX, 200);

    const totalInsights = sections.reduce((sum, s) => sum + s.steps.length, 0);
    const stats = [
        { label: 'MÓDULOS', value: String(sections.length) },
        { label: 'INSIGHTS', value: String(totalInsights) },
        {
            label: 'GENERADO',
            value: new Date().toLocaleDateString('es-CO', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }),
        },
    ];
    stats.forEach((s, i) => {
        const x = PAGE.marginX + i * 60;
        setColor(COLORS.muted);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(s.label, x, 213);
        setColor(COLORS.ink);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(s.label === 'GENERADO' ? 14 : 26);
        doc.text(s.value, x, s.label === 'GENERADO' ? 224 : 228);
    });

    // Footer hint
    setColor(COLORS.muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('soporte@paecontable.co', PAGE.marginX, PAGE.height - 12);

    // -----------------------------------------------------------------------
    // PAGE 2 — TABLE OF CONTENTS
    // -----------------------------------------------------------------------
    newPage();
    setColor(COLORS.accent);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ÍNDICE', PAGE.marginX, y);
    y += 12;

    setColor(COLORS.ink);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(34);
    doc.text('Contenido', PAGE.marginX, y);
    y += 18;

    sections.forEach((s) => {
        ensureSpace(18);

        // Number
        setColor(s.accent);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(s.number, PAGE.marginX, y);

        // Title
        setColor(COLORS.ink);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.text(s.title, PAGE.marginX + 14, y);

        // Subtitle
        setColor(COLORS.muted);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.text(s.subtitle, PAGE.marginX + 14, y + 5);

        // Insight count (right aligned)
        setColor(COLORS.light);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(
            `${s.steps.length} insights`,
            PAGE.width - PAGE.marginX,
            y,
            { align: 'right' }
        );

        // Underline
        setDraw(COLORS.line);
        doc.setLineWidth(0.15);
        doc.line(PAGE.marginX, y + 10, PAGE.width - PAGE.marginX, y + 10);

        y += 16;
    });

    // -----------------------------------------------------------------------
    // SECTIONS
    // -----------------------------------------------------------------------
    sections.forEach((section) => {
        newPage();

        // ── Section header ──
        setColor(section.accent);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(
            `${section.number} / ${String(sections.length).padStart(2, '0')}`,
            PAGE.marginX,
            y
        );
        y += 8;

        setColor(COLORS.ink);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(36);
        const titleLines = doc.splitTextToSize(section.title, CONTENT_W);
        doc.text(titleLines, PAGE.marginX, y);
        y += titleLines.length * 14 + 2;

        setColor(COLORS.muted);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(13);
        doc.text(`— ${section.subtitle}`, PAGE.marginX, y);
        y += 8;

        // Accent rule
        setDraw(section.accent);
        doc.setLineWidth(1.2);
        doc.line(PAGE.marginX, y, PAGE.marginX + 30, y);
        y += 8;

        // Lede
        setColor(COLORS.text);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const ledeLines = doc.splitTextToSize(section.lede, CONTENT_W);
        ensureSpace(ledeLines.length * 5 + 6);
        doc.text(ledeLines, PAGE.marginX, y);
        y += ledeLines.length * 5 + 8;

        // KPIs (if present)
        if (section.kpis && section.kpis.length > 0) {
            ensureSpace(20);
            setDraw(COLORS.line);
            doc.setLineWidth(0.15);
            doc.line(PAGE.marginX, y, PAGE.width - PAGE.marginX, y);
            y += 6;

            section.kpis.forEach((kpi, i) => {
                const colW = CONTENT_W / section.kpis!.length;
                const x = PAGE.marginX + i * colW;
                setColor(section.accent);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(20);
                doc.text(kpi.value, x, y + 5);
                setColor(COLORS.muted);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7);
                doc.text(kpi.label.toUpperCase(), x, y + 11);
            });
            y += 14;
            doc.line(PAGE.marginX, y, PAGE.width - PAGE.marginX, y);
            y += 10;
        }

        // ── Steps ──
        section.steps.forEach((step: HelpStep, sIdx: number) => {
            renderStep(step, sIdx, section.accent);
        });

        // ── Section tip ──
        if (section.tip) {
            const tipLines = doc.splitTextToSize(section.tip, CONTENT_W - 10);
            const boxH = tipLines.length * 5 + 15;
            ensureSpace(boxH + 4);

            setFill(section.accent);
            doc.setGState(doc.GState({ opacity: 0.08 }));
            doc.rect(PAGE.marginX, y, CONTENT_W, boxH, 'F');
            doc.setGState(doc.GState({ opacity: 1 }));

            setDraw(section.accent);
            doc.setLineWidth(0.2);
            doc.rect(PAGE.marginX, y, CONTENT_W, boxH, 'S');

            setColor(section.accent);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.text('TIP', PAGE.marginX + 4, y + 6);

            setColor(COLORS.ink);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(tipLines, PAGE.marginX + 4, y + 12);

            y += boxH + 6;
        }
    });

    // -----------------------------------------------------------------------
    // STEP RENDERER (closure over doc + y)
    // -----------------------------------------------------------------------
    function renderStep(step: HelpStep, idx: number, accent: string) {
        ensureSpace(20);

        // Step number
        setColor(accent);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(String(idx + 1).padStart(2, '0'), PAGE.marginX, y);

        // Step title
        setColor(COLORS.ink);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        const titleLines = doc.splitTextToSize(step.title, CONTENT_W - 10);
        doc.text(titleLines, PAGE.marginX + 8, y);
        y += titleLines.length * 6 + 4;

        // Body
        setColor(COLORS.text);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const bodyLines = doc.splitTextToSize(step.body, CONTENT_W);
        ensureSpace(bodyLines.length * 4.5 + 4);
        doc.text(bodyLines, PAGE.marginX, y);
        y += bodyLines.length * 4.5 + 4;

        // Highlights
        if (step.highlights && step.highlights.length > 0) {
            setColor(accent);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            ensureSpace(8);
            doc.text('PUNTOS CLAVE', PAGE.marginX, y);
            y += 4;

            // Left accent bar
            const startY = y - 1;
            step.highlights.forEach((h) => {
                const lines = doc.splitTextToSize(h, CONTENT_W - 10);
                ensureSpace(lines.length * 4.5 + 2);
                setColor(COLORS.text);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9.5);
                lines.forEach((line: string, i: number) => {
                    doc.text(
                        (i === 0 ? '▸  ' : '   ') + line,
                        PAGE.marginX + 4,
                        y
                    );
                    y += 4.5;
                });
                y += 1;
            });

            // Draw the accent bar after we know the height
            setDraw(accent);
            doc.setLineWidth(0.6);
            doc.line(PAGE.marginX + 1, startY, PAGE.marginX + 1, y - 2);

            y += 3;
        }

        // Code block
        if (step.code) {
            const codeLines = doc.splitTextToSize(step.code, CONTENT_W - 10);
            const boxH = codeLines.length * 4.5 + 6;
            ensureSpace(boxH + 4);

            setFill(COLORS.bg);
            doc.rect(PAGE.marginX, y, CONTENT_W, boxH, 'F');

            setDraw(accent);
            doc.setLineWidth(0.8);
            doc.line(PAGE.marginX, y, PAGE.marginX, y + boxH);

            setColor(COLORS.ink);
            doc.setFont('courier', 'normal');
            doc.setFontSize(9);
            doc.text(codeLines, PAGE.marginX + 4, y + 5);

            y += boxH + 4;
        }

        // Warning
        if (step.warning) {
            const wLines = doc.splitTextToSize(step.warning, CONTENT_W - 10);
            const boxH = wLines.length * 4.5 + 12;
            ensureSpace(boxH + 4);

            setFill(COLORS.warningBg);
            doc.rect(PAGE.marginX, y, CONTENT_W, boxH, 'F');

            setDraw(COLORS.warningBorder);
            doc.setLineWidth(0.3);
            doc.rect(PAGE.marginX, y, CONTENT_W, boxH, 'S');

            setColor(COLORS.warningLabel);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.text('CUIDADO', PAGE.marginX + 4, y + 6);

            setColor(COLORS.warningText);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.5);
            doc.text(wLines, PAGE.marginX + 4, y + 11);

            y += boxH + 4;
        }

        // Related
        if (step.related) {
            ensureSpace(8);
            setColor(accent);
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            doc.text(`→  ${step.related}`, PAGE.marginX, y);
            y += 6;
        }

        y += 4; // gap between steps
    }

    // -----------------------------------------------------------------------
    // Final page
    // -----------------------------------------------------------------------
    newPage();
    setColor(COLORS.ink);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(40);
    doc.text('Fin del manual.', PAGE.marginX, PAGE.height / 2);

    setColor(COLORS.muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(
        'soporte@paecontable.co  ·  v0.1.0',
        PAGE.marginX,
        PAGE.height / 2 + 12
    );

    // Page numbers (footer of each content page, skip cover)
    const pageCount = doc.getNumberOfPages();
    for (let p = 2; p <= pageCount; p++) {
        doc.setPage(p);
        setColor(COLORS.light);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(
            `${String(p).padStart(2, '0')} / ${String(pageCount).padStart(2, '0')}`,
            PAGE.width - PAGE.marginX,
            PAGE.height - 10,
            { align: 'right' }
        );
        doc.text('PAE CONTABLE · Manual', PAGE.marginX, PAGE.height - 10);
    }

    return doc.output('blob');
}
