/**
 * PDF Generator for OSINT Reports
 * Phase 6: Report Generation
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type {
  ReportData,
  PDFGenerationOptions,
  ReportSection,
  InvestigationSummary,
} from '@/types/reports';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

const DEFAULT_PDF_OPTIONS: PDFGenerationOptions = {
  orientation: 'portrait',
  pageSize: 'A4',
  margins: {
    top: 20,
    right: 15,
    bottom: 20,
    left: 15,
  },
  includeHeader: true,
  includeFooter: true,
  includePageNumbers: true,
  includeTableOfContents: false,
};

export class PDFGenerator {
  private doc: jsPDF;
  private options: PDFGenerationOptions;
  private currentY: number = 0;
  private pageHeight: number;
  private pageWidth: number;

  constructor(options: Partial<PDFGenerationOptions> = {}) {
    this.options = { ...DEFAULT_PDF_OPTIONS, ...options };

    this.doc = new jsPDF({
      orientation: this.options.orientation,
      unit: 'mm',
      format: this.options.pageSize,
    });

    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.currentY = this.options.margins.top;
  }

  /**
   * Generate PDF from report data
   */
  public async generateReport(reportData: ReportData): Promise<Buffer> {
    // Add title page
    this.addTitlePage(reportData);

    // Add metadata page
    this.addMetadataPage(reportData);

    // Add table of contents if requested
    if (this.options.includeTableOfContents) {
      this.addTableOfContents(reportData);
    }

    // Add summary if available
    if (reportData.summary) {
      this.addSummaryPage(reportData.summary);
    }

    // Add sections
    for (const section of reportData.sections) {
      this.addSection(section);
    }

    // Add footer to all pages
    if (this.options.includeFooter) {
      this.addFooters();
    }

    // Return PDF as buffer
    return Buffer.from(this.doc.output('arraybuffer'));
  }

  /**
   * Generate investigation summary PDF
   */
  public async generateInvestigationSummary(
    summary: InvestigationSummary
  ): Promise<Buffer> {
    // Title page
    this.addTitle(`Investigation Report: ${summary.name}`, 28);
    this.currentY += 10;

    if (summary.description) {
      this.addText(summary.description, { fontSize: 12, color: [100, 100, 100] });
      this.currentY += 10;
    }

    // Investigation details
    this.addSectionTitle('Investigation Details');
    const details = [
      ['Status', summary.status.toUpperCase()],
      ['Total Items', summary.totalItems.toString()],
      ['Completed Jobs', summary.completedJobs.toString()],
      ['Pending Jobs', summary.pendingJobs.toString()],
      ['Failed Jobs', summary.failedJobs.toString()],
      ['Date Range', `${format(new Date(summary.dateRange.start), 'MMM dd, yyyy')} - ${format(new Date(summary.dateRange.end), 'MMM dd, yyyy')}`],
      ['Tools Used', summary.toolsUsed.join(', ')],
      ['Tags', summary.tags.join(', ')],
    ];

    this.addTable(['Property', 'Value'], details);
    this.currentY += 10;

    // Key findings
    if (summary.keyFindings.length > 0) {
      this.addSectionTitle('Key Findings');

      for (const finding of summary.keyFindings) {
        this.checkPageBreak(30);

        // Finding title with severity
        this.addText(
          `${finding.title} [${finding.severity.toUpperCase()}]`,
          { fontSize: 12, bold: true }
        );
        this.currentY += 5;

        // Description
        this.addText(finding.description, { fontSize: 10 });
        this.currentY += 5;

        // Category and tags
        this.addText(
          `Category: ${finding.category} | Tags: ${finding.tags.join(', ')}`,
          { fontSize: 9, color: [100, 100, 100] }
        );
        this.currentY += 10;
      }
    }

    if (this.options.includeFooter) {
      this.addFooters();
    }

    return Buffer.from(this.doc.output('arraybuffer'));
  }

  /**
   * Add title page
   */
  private addTitlePage(reportData: ReportData): void {
    const centerX = this.pageWidth / 2;
    const centerY = this.pageHeight / 2;

    // Title
    this.doc.setFontSize(32);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(reportData.title, centerX, centerY - 30, { align: 'center' });

    // Subtitle
    if (reportData.description) {
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 100, 100);
      const splitDescription = this.doc.splitTextToSize(
        reportData.description,
        this.pageWidth - 40
      );
      this.doc.text(splitDescription, centerX, centerY - 10, { align: 'center' });
    }

    // Generation date
    this.doc.setFontSize(12);
    this.doc.setTextColor(150, 150, 150);
    this.doc.text(
      `Generated: ${format(new Date(reportData.metadata.generatedAt), 'MMMM dd, yyyy HH:mm')}`,
      centerX,
      centerY + 20,
      { align: 'center' }
    );

    // Template
    this.doc.text(
      `Template: ${reportData.metadata.template}`,
      centerX,
      centerY + 30,
      { align: 'center' }
    );

    this.doc.addPage();
    this.currentY = this.options.margins.top;
  }

  /**
   * Add metadata page
   */
  private addMetadataPage(reportData: ReportData): void {
    this.addSectionTitle('Report Information');

    const metadata = [
      ['Generated At', format(new Date(reportData.metadata.generatedAt), 'MMMM dd, yyyy HH:mm:ss')],
      ['Generated By', reportData.metadata.generatedBy],
      ['Template', reportData.metadata.template],
    ];

    if (reportData.metadata.investigationName) {
      metadata.push(['Investigation', reportData.metadata.investigationName]);
    }

    if (reportData.metadata.totalItems) {
      metadata.push(['Total Items', reportData.metadata.totalItems.toString()]);
    }

    if (reportData.metadata.toolsUsed && reportData.metadata.toolsUsed.length > 0) {
      metadata.push(['Tools Used', reportData.metadata.toolsUsed.join(', ')]);
    }

    this.addTable(['Property', 'Value'], metadata);
    this.doc.addPage();
    this.currentY = this.options.margins.top;
  }

  /**
   * Add table of contents
   */
  private addTableOfContents(reportData: ReportData): void {
    this.addSectionTitle('Table of Contents');
    this.currentY += 5;

    let pageNum = 3; // Start after title and metadata pages

    if (reportData.summary) {
      this.addText(`Summary ..................................... ${pageNum}`, { fontSize: 11 });
      this.currentY += 7;
      pageNum++;
    }

    reportData.sections.forEach((section, index) => {
      this.addText(
        `${index + 1}. ${section.title} ..................................... ${pageNum}`,
        { fontSize: 11 }
      );
      this.currentY += 7;
      pageNum++;
    });

    this.doc.addPage();
    this.currentY = this.options.margins.top;
  }

  /**
   * Add summary page
   */
  private addSummaryPage(summary: ReportData['summary']): void {
    if (!summary) return;

    this.addSectionTitle('Executive Summary');
    this.currentY += 5;

    // Key findings
    if (summary.keyFindings && summary.keyFindings.length > 0) {
      this.addSubtitle('Key Findings');
      summary.keyFindings.forEach((finding, index) => {
        this.addText(`${index + 1}. ${finding}`, { fontSize: 11 });
        this.currentY += 6;
      });
      this.currentY += 5;
    }

    // Recommendations
    if (summary.recommendations && summary.recommendations.length > 0) {
      this.addSubtitle('Recommendations');
      summary.recommendations.forEach((rec, index) => {
        this.addText(`${index + 1}. ${rec}`, { fontSize: 11 });
        this.currentY += 6;
      });
      this.currentY += 5;
    }

    // Conclusion
    if (summary.conclusion) {
      this.addSubtitle('Conclusion');
      this.addText(summary.conclusion, { fontSize: 11 });
    }

    this.doc.addPage();
    this.currentY = this.options.margins.top;
  }

  /**
   * Add a section to the PDF
   */
  private addSection(section: ReportSection): void {
    this.checkPageBreak(30);
    this.addSectionTitle(section.title);
    this.currentY += 5;

    switch (section.type) {
      case 'text':
        this.addTextSection(section.content as string);
        break;
      case 'table':
        this.addTableSection(section.content as { headers: string[]; rows: string[][] });
        break;
      case 'findings':
        this.addFindingsSection(section.content as unknown[]);
        break;
      default:
        this.addText('Unsupported section type', { fontSize: 10, color: [200, 0, 0] });
    }

    this.currentY += 10;
  }

  /**
   * Add text section
   */
  private addTextSection(content: string): void {
    this.addText(content, { fontSize: 11 });
  }

  /**
   * Add table section
   */
  private addTableSection(content: { headers: string[]; rows: string[][] }): void {
    this.addTable(content.headers, content.rows);
  }

  /**
   * Add findings section
   */
  private addFindingsSection(findings: unknown[]): void {
    findings.forEach((finding, index) => {
      this.checkPageBreak(20);
      const findingObj = finding as Record<string, unknown>;
      this.addText(
        `${index + 1}. ${findingObj.title || 'Finding'}`,
        { fontSize: 11, bold: true }
      );
      this.currentY += 5;

      if (findingObj.description) {
        this.addText(findingObj.description as string, { fontSize: 10 });
        this.currentY += 5;
      }
    });
  }

  /**
   * Helper methods
   */

  private addTitle(text: string, fontSize = 20): void {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(text, this.options.margins.left, this.currentY);
    this.currentY += fontSize / 2;
  }

  private addSectionTitle(text: string): void {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(text, this.options.margins.left, this.currentY);
    this.currentY += 8;
  }

  private addSubtitle(text: string): void {
    this.doc.setFontSize(13);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(50, 50, 50);
    this.doc.text(text, this.options.margins.left, this.currentY);
    this.currentY += 7;
  }

  private addText(
    text: string,
    options: {
      fontSize?: number;
      bold?: boolean;
      color?: [number, number, number];
    } = {}
  ): void {
    this.doc.setFontSize(options.fontSize || 11);
    this.doc.setFont('helvetica', options.bold ? 'bold' : 'normal');

    if (options.color) {
      this.doc.setTextColor(...options.color);
    } else {
      this.doc.setTextColor(0, 0, 0);
    }

    const maxWidth = this.pageWidth - this.options.margins.left - this.options.margins.right;
    const lines = this.doc.splitTextToSize(text, maxWidth);

    lines.forEach((line: string) => {
      this.checkPageBreak(7);
      this.doc.text(line, this.options.margins.left, this.currentY);
      this.currentY += 6;
    });
  }

  private addTable(headers: string[], rows: string[][]): void {
    autoTable(this.doc, {
      head: [headers],
      body: rows,
      startY: this.currentY,
      margin: { left: this.options.margins.left, right: this.options.margins.right },
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 66, 66] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    // Update currentY after table
    // @ts-expect-error - autoTable adds finalY to doc
    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.options.margins.bottom) {
      this.doc.addPage();
      this.currentY = this.options.margins.top;
    }
  }

  private addFooters(): void {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(9);
      this.doc.setTextColor(150, 150, 150);

      // Page number
      if (this.options.includePageNumbers) {
        this.doc.text(
          `Page ${i} of ${pageCount}`,
          this.pageWidth / 2,
          this.pageHeight - 10,
          { align: 'center' }
        );
      }

      // Footer text
      this.doc.text(
        'OSINT Web Application - Confidential',
        this.options.margins.left,
        this.pageHeight - 10
      );

      // Generation date
      this.doc.text(
        format(new Date(), 'yyyy-MM-dd'),
        this.pageWidth - this.options.margins.right,
        this.pageHeight - 10,
        { align: 'right' }
      );
    }
  }
}

/**
 * Convenience function to generate PDF
 */
export async function generatePDF(
  reportData: ReportData,
  options?: Partial<PDFGenerationOptions>
): Promise<Buffer> {
  const generator = new PDFGenerator(options);
  return generator.generateReport(reportData);
}

/**
 * Generate investigation summary PDF
 */
export async function generateInvestigationSummaryPDF(
  summary: InvestigationSummary,
  options?: Partial<PDFGenerationOptions>
): Promise<Buffer> {
  const generator = new PDFGenerator(options);
  return generator.generateInvestigationSummary(summary);
}
