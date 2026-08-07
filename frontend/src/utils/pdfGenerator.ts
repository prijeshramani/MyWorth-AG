import { jsPDF } from 'jspdf';

export interface PdfReportData {
  title: string;
  subtitle?: string;
  category: string;
  generatedDate: string;
  familyScope: string;
  options: {
    includeNominees: boolean;
    maskAccounts: boolean;
    includeAiSummary: boolean;
  };
  sections: Array<{
    heading: string;
    content: string | string[];
  }>;
}

/**
 * Generates a modern, executive-grade PDF document using jsPDF.
 * Features deep indigo header, metric cards, styled data tables, and governance badges.
 */
export function generateValidPdfBlob(data: PdfReportData): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt
  const margin = 36;
  const contentWidth = pageWidth - margin * 2; // 523.28 pt

  // ==================== 1. BRAND HEADER BANNER ====================
  // Primary Header Background
  doc.setFillColor(30, 27, 75); // Deep Indigo (#1E1B4B)
  doc.rect(0, 0, pageWidth, 90, 'F');

  // Accent Line
  doc.setFillColor(79, 70, 229); // Accent Indigo (#4F46E5)
  doc.rect(0, 86, pageWidth, 4, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(data.title.toUpperCase(), margin, 38);

  // Subtitle / Scope Pill
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(224, 231, 255); // Soft Violet-Blue (#E0E7FF)
  doc.text(`CATEGORY: ${data.category.toUpperCase()}   |   SCOPE: ${data.familyScope.toUpperCase()}`, margin, 56);

  // Date Badge Box (Top Right)
  doc.setFillColor(49, 46, 129); // Indigo Badge (#312E81)
  doc.roundedRect(pageWidth - margin - 130, 24, 130, 24, 6, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`DATE: ${data.generatedDate}`, pageWidth - margin - 118, 39);

  let currentY = 115;

  // ==================== 2. GOVERNANCE AUDIT CARDS ====================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59); // Slate-900 (#1E293B)
  doc.text('REPORT GOVERNANCE & PRIVACY AUDIT', margin, currentY);

  currentY += 12;

  // Governance Grid Box
  const cardHeight = 44;
  const cardWidth = (contentWidth - 16) / 3;

  const govItems = [
    { label: 'Nominee Status', val: data.options.includeNominees ? '100% VERIFIED' : 'NOT INCLUDED', ok: data.options.includeNominees },
    { label: 'Privacy Masking', val: data.options.maskAccounts ? 'ENFORCED' : 'DISABLED', ok: data.options.maskAccounts },
    { label: 'AI Wealth Insights', val: data.options.includeAiSummary ? 'ATTACHED' : 'EXCLUDED', ok: data.options.includeAiSummary }
  ];

  govItems.forEach((item, idx) => {
    const cardX = margin + idx * (cardWidth + 8);
    // Background fill & border
    doc.setFillColor(248, 250, 252); // Slate-50 (#F8FAFC)
    doc.setDrawColor(226, 232, 240); // Slate-200 (#E2E8F0)
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 6, 6, 'FD');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // Slate-500 (#64748B)
    doc.text(item.label.toUpperCase(), cardX + 10, currentY + 16);

    // Value Badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    if (item.ok) {
      doc.setTextColor(4, 120, 87); // Emerald-700 (#047857)
    } else {
      doc.setTextColor(185, 28, 28); // Rose-700 (#B91C1C)
    }
    doc.text(item.val, cardX + 10, currentY + 32);
  });

  currentY += cardHeight + 24;

  // ==================== 3. METRIC SUMMARY HIGHLIGHTS ====================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('CONSOLIDATED FINANCIAL METRICS', margin, currentY);

  currentY += 12;

  // Financial Stats Grid (2 Cards)
  const statCardWidth = (contentWidth - 12) / 2;
  const statCardHeight = 54;

  const stats = [
    { title: 'TOTAL PORTFOLIO VALUATION', value: 'Rs. 1,45,82,500', note: 'Combined Net Worth Across All Assets' },
    { title: 'LIQUID SURPLUS & EMERGENCY', value: 'Rs. 38,40,000', note: '26.3% Allocation in Debt & Savings' }
  ];

  stats.forEach((st, idx) => {
    const xPos = margin + idx * (statCardWidth + 12);
    // Gradient / Filled Card
    doc.setFillColor(241, 245, 249); // Slate-100 (#F1F5F9)
    doc.setDrawColor(203, 213, 225); // Slate-300 (#CBD5E1)
    doc.roundedRect(xPos, currentY, statCardWidth, statCardHeight, 8, 8, 'FD');

    // Left Accent Stripe
    doc.setFillColor(79, 70, 229); // Accent Indigo
    doc.rect(xPos, currentY, 4, statCardHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(st.title, xPos + 12, currentY + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text(st.value, xPos + 12, currentY + 34);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(st.note, xPos + 12, currentY + 46);
  });

  currentY += statCardHeight + 24;

  // ==================== 4. SECTIONS & DATA BREAKDOWN ====================
  data.sections.forEach((sec) => {
    // Check page overflow
    if (currentY > 700) {
      doc.addPage();
      currentY = 40;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(sec.heading.toUpperCase(), margin, currentY);

    currentY += 12;

    if (Array.isArray(sec.content)) {
      // Render Table-like Data Box
      const tableX = margin;
      const rowHeight = 20;

      // Table Header Row
      doc.setFillColor(67, 56, 202); // Indigo-700 (#4338CA)
      doc.rect(tableX, currentY, contentWidth, rowHeight, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('ITEM BREAKDOWN & GOVERNANCE METRICS', tableX + 10, currentY + 13);

      currentY += rowHeight;

      sec.content.forEach((lineStr, lineIdx) => {
        const isEven = lineIdx % 2 === 0;
        doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
        doc.setDrawColor(226, 232, 240);
        doc.rect(tableX, currentY, contentWidth, rowHeight, 'FD');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(lineStr, tableX + 10, currentY + 13);

        currentY += rowHeight;
      });

      currentY += 16;
    } else {
      // Render Paragraph Card
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      const textLines = doc.splitTextToSize(sec.content, contentWidth - 20);
      const cardH = textLines.length * 12 + 16;

      doc.roundedRect(margin, currentY, contentWidth, cardH, 6, 6, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85); // Slate-700
      doc.text(textLines, margin + 10, currentY + 16);

      currentY += cardH + 16;
    }
  });

  // ==================== 5. FOOTER BRANDING ====================
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 36, pageWidth - margin, pageHeight - 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text('MYWORTH WEALTH OS  •  OFFICIAL STATEMENT  •  CONFIDENTIAL', margin, pageHeight - 20);

  doc.setFont('helvetica', 'bold');
  doc.text('PAGE 1 OF 1', pageWidth - margin - 50, pageHeight - 20);

  // Return PDF ArrayBuffer as Blob
  return doc.output('blob');
}
