/**
 * Generates the PAE Contable user manual as a PDF using jsPDF.
 * Brutalist editorial design — committed to scale, contrast, accent blocks.
 * Lazy-loaded so jsPDF only enters the bundle when the user clicks download.
 */

import type { HelpSection, HelpStep } from './helpData';

const COLORS = {
    ink: '#0A0E1A',
    white: '#FAFAF5',
    text: '#1F2937',
    soft: '#4B5563',
    muted: '#6B7280',
    light: '#9CA3AF',
    line: '#E5E7EB',
    bg: '#F3F4F6',
    accent: '#6366F1',
    chartreuse: '#D4FF00',
    pink: '#EC4899',
    warningBg: '#FFFBEB',
    warningBorder: '#FCD34D',
    warningLabel: '#D97706',
    warningText: '#78350F',
};

const PAGE = {
    width: 210,
    height: 297,
    marginX: 20,
    marginTop: 22,
    marginBottom: 22,
};

const CONTENT_W = PAGE.width - PAGE.marginX * 2;

function hexToRgb(hex: string): [number, number, number] {
    const m = hex.replace('#', '');
    const v = parseInt(m, 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export async function generateManualPDF(sections: HelpSection[]): Promise<Blob> {
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF({ unit: 'mm', format: 'a4', putOnlyUsedFonts: true });
    let y = PAGE.marginTop;

    const setText = (color: string) => doc.setTextColor(...hexToRgb(color));
    const setFill = (color: string) => doc.setFillColor(...hexToRgb(color));
    const setDraw = (color: string) => doc.setDrawColor(...hexToRgb(color));

    const newPage = () => {
        doc.addPage();
        y = PAGE.marginTop;
    };

    const ensureSpace = (needed: number) => {
        if (y + needed > PAGE.height - PAGE.marginBottom) newPage();
    };

    // -----------------------------------------------------------------------
    // PAGE 1 — COVER (color-blocked, brutalist)
    // -----------------------------------------------------------------------

    // Top accent block (chartreuse strip)
    setFill(COLORS.chartreuse);
    doc.rect(0, 0, PAGE.width, 50, 'F');

    // Top label inside chartreuse
    setText(COLORS.ink);
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.text('PAE CONTABLE  ///  MANUAL_v0.1', PAGE.marginX, 18);

    // Stat counters in chartreuse band
    const totalInsights = sections.reduce((sum, s) => sum + s.steps.length, 0);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.text(
        `${sections.length} MÓDULOS  //  ${totalInsights} INSIGHTS  //  EDICIÓN ${new Date().getFullYear()}`,
        PAGE.marginX,
        25
    );

    // Number marker on right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(72);
    doc.text('00', PAGE.width - PAGE.marginX, 38, { align: 'right' });

    // Massive title block
    setText(COLORS.ink);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(78);
    doc.text('CÓMO', PAGE.marginX, 100);

    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(78);
    setText(COLORS.accent);
    doc.text('USAR', PAGE.marginX, 130);
    setText(COLORS.pink);
    doc.text('ESTO.', PAGE.marginX, 160);

    // Heavy black rule
    setDraw(COLORS.ink);
    doc.setLineWidth(1.2);
    doc.line(PAGE.marginX, 170, PAGE.width - PAGE.marginX, 170);

    // Subtitle
    setText(COLORS.soft);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const subLines = doc.splitTextToSize(
        'Sistema multiagente contable para Colombia. Manual de usuario completo: ' +
            'empresa activa, dashboard, ingesta de documentos (Via A y Via B), transacciones, ' +
            'libros contables, reportes financieros, módulo tributario y troubleshooting.',
        CONTENT_W
    );
    doc.text(subLines, PAGE.marginX, 182);

    // Stats panel — three-column brutalist grid
    const statsY = 230;
    const statBoxes = [
        { value: String(sections.length), label: 'MÓDULOS', color: COLORS.accent },
        { value: String(totalInsights), label: 'INSIGHTS', color: COLORS.pink },
        {
            value: new Date()
                .toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' })
                .replace(/\//g, '.'),
            label: 'EDICIÓN',
            color: COLORS.ink,
        },
    ];
    const colW = CONTENT_W / 3;
    statBoxes.forEach((s, i) => {
        const x = PAGE.marginX + i * colW;
        // Top rule
        setDraw(s.color);
        doc.setLineWidth(0.8);
        doc.line(x, statsY, x + colW - 4, statsY);
        // Value
        setText(s.color);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(s.label === 'EDICIÓN' ? 24 : 38);
        doc.text(s.value, x, statsY + (s.label === 'EDICIÓN' ? 14 : 20));
        // Label
        setText(COLORS.muted);
        doc.setFont('courier', 'bold');
        doc.setFontSize(7);
        doc.text(s.label, x, statsY + 28);
    });

    // Bottom accent block
    setFill(COLORS.ink);
    doc.rect(0, PAGE.height - 18, PAGE.width, 18, 'F');
    setText(COLORS.chartreuse);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text('soporte@paecontable.co', PAGE.marginX, PAGE.height - 7);
    doc.text('// PRESS / TO SEARCH', PAGE.width - PAGE.marginX, PAGE.height - 7, {
        align: 'right',
    });

    // -----------------------------------------------------------------------
    // PAGE 2 — TABLE OF CONTENTS
    // -----------------------------------------------------------------------
    newPage();

    // Top label strip
    setFill(COLORS.ink);
    doc.rect(0, 0, PAGE.width, 12, 'F');
    setText(COLORS.chartreuse);
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.text('// ÍNDICE', PAGE.marginX, 8);
    doc.text(
        `1 / ${String(sections.length + 2)}`,
        PAGE.width - PAGE.marginX,
        8,
        { align: 'right' }
    );

    y = 30;
    setText(COLORS.ink);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(48);
    doc.text('ÍNDICE.', PAGE.marginX, y);
    y += 4;

    setText(COLORS.muted);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.text(
        `${sections.length} módulos · ${totalInsights} insights detallados`,
        PAGE.marginX,
        y + 6
    );
    y += 18;

    // Heavy rule
    setDraw(COLORS.ink);
    doc.setLineWidth(1.5);
    doc.line(PAGE.marginX, y, PAGE.width - PAGE.marginX, y);
    y += 10;

    sections.forEach((s) => {
        ensureSpace(22);

        // Big number
        setText(s.accent);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(28);
        doc.text(s.number, PAGE.marginX, y + 6);

        // Title
        setText(COLORS.ink);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text(s.title.toUpperCase(), PAGE.marginX + 22, y + 4);

        // Subtitle in mono
        setText(COLORS.muted);
        doc.setFont('courier', 'normal');
        doc.setFontSize(8);
        doc.text(`// ${s.subtitle}`, PAGE.marginX + 22, y + 10);

        // Insight count badge (right)
        setFill(s.accent);
        doc.setGState(doc.GState({ opacity: 0.15 }));
        doc.rect(PAGE.width - PAGE.marginX - 26, y - 1, 26, 9, 'F');
        doc.setGState(doc.GState({ opacity: 1 }));
        setText(s.accent);
        doc.setFont('courier', 'bold');
        doc.setFontSize(8);
        doc.text(
            `${String(s.steps.length)} INSIGHTS`,
            PAGE.width - PAGE.marginX - 13,
            y + 4.5,
            { align: 'center' }
        );

        // Underline
        setDraw(COLORS.line);
        doc.setLineWidth(0.2);
        doc.line(PAGE.marginX, y + 16, PAGE.width - PAGE.marginX, y + 16);

        y += 22;
    });

    // -----------------------------------------------------------------------
    // SECTIONS
    // -----------------------------------------------------------------------
    sections.forEach((section, sectionIdx) => {
        newPage();

        // Top strip with section accent
        setFill(section.accent);
        doc.rect(0, 0, PAGE.width, 8, 'F');

        // Page label strip (black, below accent)
        setFill(COLORS.ink);
        doc.rect(0, 8, PAGE.width, 10, 'F');
        setText(COLORS.white);
        doc.setFont('courier', 'bold');
        doc.setFontSize(8);
        doc.text(`// ${section.title.toUpperCase()}`, PAGE.marginX, 15);
        doc.text(
            `${section.number} / ${String(sections.length)}`,
            PAGE.width - PAGE.marginX,
            15,
            { align: 'right' }
        );

        y = 35;

        // Giant ghost number (background graphic)
        setText(section.accent);
        doc.setGState(doc.GState({ opacity: 0.08 }));
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(280);
        doc.text(section.number, PAGE.width - PAGE.marginX + 5, 130, { align: 'right' });
        doc.setGState(doc.GState({ opacity: 1 }));

        // Section header — accent rule + small label
        setDraw(section.accent);
        doc.setLineWidth(2);
        doc.line(PAGE.marginX, y, PAGE.marginX + 25, y);
        setText(section.accent);
        doc.setFont('courier', 'bold');
        doc.setFontSize(8);
        doc.text(
            `${section.number} / ${String(sections.length)}`,
            PAGE.marginX + 28,
            y + 2
        );
        y += 12;

        // Section title — massive
        setText(COLORS.ink);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(48);
        const titleLines = doc.splitTextToSize(section.title.toUpperCase(), CONTENT_W);
        titleLines.forEach((line: string) => {
            doc.text(line, PAGE.marginX, y);
            y += 18;
        });
        y -= 4;

        // Subtitle — italic
        setText(COLORS.muted);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(13);
        doc.text(`— ${section.subtitle}`, PAGE.marginX, y);
        y += 12;

        // Lede
        setText(COLORS.text);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const ledeLines = doc.splitTextToSize(section.lede, CONTENT_W);
        ensureSpace(ledeLines.length * 5 + 6);
        doc.text(ledeLines, PAGE.marginX, y);
        y += ledeLines.length * 5 + 8;

        // KPIs — bold strip
        if (section.kpis && section.kpis.length > 0) {
            ensureSpace(28);
            setDraw(COLORS.ink);
            doc.setLineWidth(0.4);
            doc.line(PAGE.marginX, y, PAGE.width - PAGE.marginX, y);
            y += 6;

            const kpiColW = CONTENT_W / section.kpis.length;
            section.kpis.forEach((kpi, i) => {
                const x = PAGE.marginX + i * kpiColW;
                setText(section.accent);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(22);
                doc.text(kpi.value, x, y + 6);
                setText(COLORS.muted);
                doc.setFont('courier', 'bold');
                doc.setFontSize(7);
                doc.text(kpi.label.toUpperCase(), x, y + 14);
            });
            y += 18;
            doc.line(PAGE.marginX, y, PAGE.width - PAGE.marginX, y);
            y += 12;
        }

        // ── Steps ──
        section.steps.forEach((step: HelpStep, sIdx: number) => {
            renderStep(step, sIdx, section.accent);
        });

        // ── Section TIP — inverted block ──
        if (section.tip) {
            const tipLines = doc.splitTextToSize(section.tip, CONTENT_W - 16);
            const boxH = tipLines.length * 5 + 16;
            ensureSpace(boxH + 6);

            // Black background, accent stripe on left
            setFill(COLORS.ink);
            doc.rect(PAGE.marginX, y, CONTENT_W, boxH, 'F');
            setFill(section.accent);
            doc.rect(PAGE.marginX, y, 4, boxH, 'F');

            // TIP label — drawn chevron + text
            setFill(section.accent);
            doc.triangle(
                PAGE.marginX + 8,
                y + 4,
                PAGE.marginX + 8,
                y + 8.5,
                PAGE.marginX + 11.5,
                y + 6.25,
                'F'
            );
            setText(section.accent);
            doc.setFont('courier', 'bold');
            doc.setFontSize(7);
            doc.text('TIP', PAGE.marginX + 14, y + 7);

            // Body — white on black
            setText(COLORS.white);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(tipLines, PAGE.marginX + 8, y + 13);

            y += boxH + 6;
        }
    });

    // -----------------------------------------------------------------------
    // STEP RENDERER
    // -----------------------------------------------------------------------
    function renderStep(step: HelpStep, idx: number, accent: string) {
        ensureSpace(28);

        // Step number — large, in accent
        setText(accent);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        const numStr = String(idx + 1);
        doc.text(numStr, PAGE.marginX, y + 4);

        // Step title
        setText(COLORS.ink);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        const titleLines = doc.splitTextToSize(step.title, CONTENT_W - 14);
        titleLines.forEach((line: string, i: number) => {
            doc.text(line, PAGE.marginX + 14, y + (i === 0 ? 2 : 8) + i * 6);
        });
        y += titleLines.length * 6.5 + 4;

        // Thin accent rule
        setDraw(accent);
        doc.setLineWidth(0.4);
        doc.line(PAGE.marginX + 14, y, PAGE.marginX + 30, y);
        y += 4;

        // Body
        setText(COLORS.text);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const bodyLines = doc.splitTextToSize(step.body, CONTENT_W - 14);
        ensureSpace(bodyLines.length * 4.5 + 4);
        doc.text(bodyLines, PAGE.marginX + 14, y);
        y += bodyLines.length * 4.5 + 5;

        // Highlights
        if (step.highlights && step.highlights.length > 0) {
            ensureSpace(10);
            // Drawn rule prefix instead of unicode box-drawing chars
            setDraw(accent);
            doc.setLineWidth(0.5);
            doc.line(PAGE.marginX + 14, y - 1, PAGE.marginX + 22, y - 1);
            setText(accent);
            doc.setFont('courier', 'bold');
            doc.setFontSize(7);
            doc.text('PUNTOS CLAVE', PAGE.marginX + 24, y);
            y += 5;

            const startY = y - 2;
            step.highlights.forEach((h) => {
                const lines = doc.splitTextToSize(h, CONTENT_W - 24);
                ensureSpace(lines.length * 4.5 + 1);
                setText(COLORS.text);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9.5);
                lines.forEach((line: string, i: number) => {
                    if (i === 0) {
                        // Drawn filled square instead of unicode triangle
                        setFill(accent);
                        doc.rect(PAGE.marginX + 18, y - 2.2, 1.6, 1.6, 'F');
                    }
                    doc.text(line, PAGE.marginX + 22, y);
                    y += 4.5;
                });
                y += 0.5;
            });

            // Accent left bar
            setDraw(accent);
            doc.setLineWidth(0.8);
            doc.line(PAGE.marginX + 14.5, startY, PAGE.marginX + 14.5, y - 1);
            y += 4;
        }

        // Warning
        if (step.warning) {
            const wLines = doc.splitTextToSize(step.warning, CONTENT_W - 28);
            const boxH = wLines.length * 4.5 + 14;
            ensureSpace(boxH + 4);

            setFill(COLORS.warningBg);
            doc.rect(PAGE.marginX + 14, y, CONTENT_W - 14, boxH, 'F');
            setFill(COLORS.warningBorder);
            doc.rect(PAGE.marginX + 14, y, 3, boxH, 'F');

            // Drawn triangle warning glyph
            setFill(COLORS.warningLabel);
            const tx = PAGE.marginX + 20;
            const ty = y + 6;
            doc.triangle(tx, ty - 2.5, tx - 2.2, ty + 1.6, tx + 2.2, ty + 1.6, 'F');
            // exclamation mark inside triangle
            setFill(COLORS.warningBg);
            doc.rect(tx - 0.25, ty - 0.5, 0.5, 1.4, 'F');
            doc.rect(tx - 0.25, ty + 1, 0.5, 0.5, 'F');

            setText(COLORS.warningLabel);
            doc.setFont('courier', 'bold');
            doc.setFontSize(7);
            doc.text('CUIDADO', PAGE.marginX + 25, y + 6);

            setText(COLORS.warningText);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.5);
            doc.text(wLines, PAGE.marginX + 19, y + 12);

            y += boxH + 5;
        }

        // Related link — pill with drawn arrow
        if (step.related) {
            ensureSpace(10);
            setDraw(accent);
            doc.setLineWidth(0.3);
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            const relText = step.related;
            const relW = doc.getTextWidth(relText) + 12;
            doc.roundedRect(PAGE.marginX + 14, y - 4, relW, 7, 1.5, 1.5, 'S');

            // Drawn arrow glyph
            const ax = PAGE.marginX + 17;
            const ay = y - 0.7;
            doc.line(ax, ay, ax + 4, ay);
            doc.line(ax + 4, ay, ax + 2.5, ay - 1.3);
            doc.line(ax + 4, ay, ax + 2.5, ay + 1.3);

            setText(accent);
            doc.text(relText, PAGE.marginX + 22, y);
            y += 8;
        }

        y += 6;
    }

    // -----------------------------------------------------------------------
    // FINAL PAGE — minimal close
    // -----------------------------------------------------------------------
    newPage();

    // Top strip
    setFill(COLORS.ink);
    doc.rect(0, 0, PAGE.width, 60, 'F');
    setText(COLORS.chartreuse);
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.text('// FIN_DEL_MANUAL', PAGE.marginX, 15);

    // Bottom strip
    setFill(COLORS.chartreuse);
    doc.rect(0, PAGE.height - 60, PAGE.width, 60, 'F');

    // Center title
    setText(COLORS.ink);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(56);
    doc.text('FIN.', PAGE.marginX, PAGE.height / 2);

    setText(COLORS.muted);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(13);
    doc.text(
        'Has llegado al final del manual. Vuelve cuando quieras.',
        PAGE.marginX,
        PAGE.height / 2 + 12
    );

    setText(COLORS.ink);
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.text(
        'soporte@paecontable.co  ·  v0.1.0  ·  ' +
            new Date().toLocaleDateString('es-CO', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            }),
        PAGE.marginX,
        PAGE.height - 12
    );

    // -----------------------------------------------------------------------
    // PAGE NUMBERS — footer of every page except cover
    // -----------------------------------------------------------------------
    const pageCount = doc.getNumberOfPages();
    for (let p = 2; p <= pageCount - 1; p++) {
        doc.setPage(p);
        setText(COLORS.muted);
        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        doc.text('PAE_MANUAL  ·  v0.1', PAGE.marginX, PAGE.height - 8);
        doc.text(
            `${String(p)} / ${String(pageCount)}`,
            PAGE.width - PAGE.marginX,
            PAGE.height - 8,
            { align: 'right' }
        );
    }

    return doc.output('blob');
}
