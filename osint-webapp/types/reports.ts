/**
 * Report Types for OSINT Web Application
 * Phase 6: Report Generation
 */

import { Database } from './database.types';

// Database types
export type Report = Database['public']['Tables']['reports']['Row'];
export type ReportInsert = Database['public']['Tables']['reports']['Insert'];
export type ReportUpdate = Database['public']['Tables']['reports']['Update'];

// Report format types
export type ReportFormat = 'pdf' | 'json' | 'csv' | 'html';

// Report template types
export type ReportTemplate =
  | 'executive-summary'
  | 'detailed-technical'
  | 'investigation-timeline'
  | 'evidence-collection'
  | 'custom';

// Report section types
export interface ReportSection {
  id: string;
  type: 'text' | 'table' | 'chart' | 'image' | 'findings';
  title: string;
  content: unknown;
  order: number;
}

// Report metadata
export interface ReportMetadata {
  template: ReportTemplate;
  generatedAt: string;
  generatedBy: string;
  investigationId?: string;
  investigationName?: string;
  totalItems?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  toolsUsed?: string[];
  customFields?: Record<string, unknown>;
}

// Report data structure
export interface ReportData {
  title: string;
  description?: string;
  metadata: ReportMetadata;
  sections: ReportSection[];
  summary?: {
    keyFindings: string[];
    recommendations?: string[];
    conclusion?: string;
  };
}

// Full report with investigation details
export interface ReportWithInvestigation extends Report {
  investigation?: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    tags: string[];
  };
  itemCount?: number;
}

// Report generation inputs
export interface CreateReportInput {
  name: string;
  investigationId: string;
  template: ReportTemplate;
  includeRawData?: boolean;
  includeSummary?: boolean;
  customSections?: ReportSection[];
  format?: ReportFormat;
}

export interface GenerateReportOptions {
  format: ReportFormat;
  template: ReportTemplate;
  includeRawData: boolean;
  includeSummary: boolean;
  includeTimeline: boolean;
  includeCharts: boolean;
}

// Report export options
export interface ExportOptions {
  format: ReportFormat;
  filename?: string;
  includeAttachments?: boolean;
}

// Report sharing
export interface ShareReportInput {
  isPublic: boolean;
  expiresAt?: string;
}

// Report statistics
export interface ReportStats {
  totalReports: number;
  reportsThisMonth: number;
  mostUsedTemplate: ReportTemplate | null;
  averageGenerationTime?: number;
}

// PDF generation options
export interface PDFGenerationOptions {
  orientation: 'portrait' | 'landscape';
  pageSize: 'A4' | 'Letter';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  includeHeader: boolean;
  includeFooter: boolean;
  includePageNumbers: boolean;
  includeTableOfContents: boolean;
}

// CSV export structure
export interface CSVExportData {
  headers: string[];
  rows: string[][];
}

// Report finding structure
export interface ReportFinding {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'info';
  category: string;
  evidence: {
    toolName: string;
    jobId: string;
    timestamp: string;
    data: unknown;
  }[];
  tags: string[];
}

// Investigation summary for report
export interface InvestigationSummary {
  id: string;
  name: string;
  description: string | null;
  status: string;
  tags: string[];
  totalItems: number;
  completedJobs: number;
  pendingJobs: number;
  failedJobs: number;
  toolsUsed: string[];
  dateRange: {
    start: string;
    end: string;
  };
  keyFindings: ReportFinding[];
}

// Report template configuration
export interface ReportTemplateConfig {
  id: ReportTemplate;
  name: string;
  description: string;
  sections: {
    id: string;
    title: string;
    type: ReportSection['type'];
    required: boolean;
    order: number;
  }[];
  defaultOptions: Partial<GenerateReportOptions>;
}
