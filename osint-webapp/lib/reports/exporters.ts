/**
 * Export utilities for different report formats
 * Phase 6: Report Generation
 */

import type {
  ReportData,
  ReportSection,
  CSVExportData,
  InvestigationSummary,
} from '@/types/reports';

/**
 * Export report to JSON format
 */
export function exportToJSON(reportData: ReportData): string {
  return JSON.stringify(reportData, null, 2);
}

/**
 * Export report to CSV format
 */
export function exportToCSV(reportData: ReportData): string {
  const csvData: CSVExportData = {
    headers: ['Section', 'Title', 'Type', 'Content'],
    rows: [],
  };

  // Add metadata row
  csvData.rows.push([
    'Metadata',
    reportData.title,
    'report',
    reportData.description || '',
  ]);

  // Add each section
  reportData.sections.forEach((section) => {
    let contentStr = '';

    switch (section.type) {
      case 'text':
        contentStr = String(section.content);
        break;
      case 'table':
        const tableContent = section.content as { headers: string[]; rows: string[][] };
        contentStr = JSON.stringify(tableContent);
        break;
      case 'findings':
        contentStr = JSON.stringify(section.content);
        break;
      default:
        contentStr = JSON.stringify(section.content);
    }

    csvData.rows.push([
      'Section',
      section.title,
      section.type,
      contentStr,
    ]);
  });

  // Convert to CSV string
  return convertToCSVString(csvData);
}

/**
 * Export investigation summary to JSON
 */
export function exportInvestigationSummaryToJSON(
  summary: InvestigationSummary
): string {
  return JSON.stringify(summary, null, 2);
}

/**
 * Export investigation summary to CSV
 */
export function exportInvestigationSummaryToCSV(
  summary: InvestigationSummary
): string {
  const csvData: CSVExportData = {
    headers: ['Category', 'Field', 'Value'],
    rows: [
      ['Investigation', 'ID', summary.id],
      ['Investigation', 'Name', summary.name],
      ['Investigation', 'Description', summary.description || ''],
      ['Investigation', 'Status', summary.status],
      ['Investigation', 'Tags', summary.tags.join('; ')],
      ['Statistics', 'Total Items', summary.totalItems.toString()],
      ['Statistics', 'Completed Jobs', summary.completedJobs.toString()],
      ['Statistics', 'Pending Jobs', summary.pendingJobs.toString()],
      ['Statistics', 'Failed Jobs', summary.failedJobs.toString()],
      ['Statistics', 'Tools Used', summary.toolsUsed.join('; ')],
      ['Date Range', 'Start', summary.dateRange.start],
      ['Date Range', 'End', summary.dateRange.end],
    ],
  };

  // Add findings
  summary.keyFindings.forEach((finding, index) => {
    csvData.rows.push([
      'Finding',
      `${index + 1}. ${finding.title}`,
      finding.description,
    ]);
    csvData.rows.push([
      'Finding Details',
      'Severity',
      finding.severity,
    ]);
    csvData.rows.push([
      'Finding Details',
      'Category',
      finding.category,
    ]);
    csvData.rows.push([
      'Finding Details',
      'Tags',
      finding.tags.join('; '),
    ]);
  });

  return convertToCSVString(csvData);
}

/**
 * Export job results to CSV
 */
export function exportJobResultsToCSV(
  jobs: Array<{
    id: string;
    tool_name: string;
    status: string;
    created_at: string;
    completed_at: string | null;
    input_data: Record<string, unknown>;
    output_data: Record<string, unknown> | null;
  }>
): string {
  const csvData: CSVExportData = {
    headers: [
      'Job ID',
      'Tool Name',
      'Status',
      'Created At',
      'Completed At',
      'Input',
      'Output',
    ],
    rows: [],
  };

  jobs.forEach((job) => {
    csvData.rows.push([
      job.id,
      job.tool_name,
      job.status,
      job.created_at,
      job.completed_at || 'N/A',
      JSON.stringify(job.input_data),
      job.output_data ? JSON.stringify(job.output_data) : 'N/A',
    ]);
  });

  return convertToCSVString(csvData);
}

/**
 * Export findings to CSV
 */
export function exportFindingsToCSV(
  findings: Array<{
    title: string;
    description: string;
    severity: string;
    category: string;
    tags: string[];
    toolName: string;
    timestamp: string;
  }>
): string {
  const csvData: CSVExportData = {
    headers: [
      'Title',
      'Description',
      'Severity',
      'Category',
      'Tags',
      'Tool',
      'Timestamp',
    ],
    rows: [],
  };

  findings.forEach((finding) => {
    csvData.rows.push([
      finding.title,
      finding.description,
      finding.severity,
      finding.category,
      finding.tags.join('; '),
      finding.toolName,
      finding.timestamp,
    ]);
  });

  return convertToCSVString(csvData);
}

/**
 * Convert CSV data to CSV string
 */
function convertToCSVString(csvData: CSVExportData): string {
  const rows: string[] = [];

  // Add headers
  rows.push(csvData.headers.map(escapeCSVValue).join(','));

  // Add data rows
  csvData.rows.forEach((row) => {
    rows.push(row.map(escapeCSVValue).join(','));
  });

  return rows.join('\n');
}

/**
 * Escape CSV value (handle quotes, commas, newlines)
 */
function escapeCSVValue(value: string): string {
  // Convert to string if not already
  const strValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (
    strValue.includes(',') ||
    strValue.includes('"') ||
    strValue.includes('\n') ||
    strValue.includes('\r')
  ) {
    return `"${strValue.replace(/"/g, '""')}"`;
  }

  return strValue;
}

/**
 * Export report to HTML format
 */
export function exportToHTML(reportData: ReportData): string {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(reportData.title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 {
      color: #1a1a1a;
      border-bottom: 3px solid #0066cc;
      padding-bottom: 10px;
    }
    h2 {
      color: #0066cc;
      margin-top: 30px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 8px;
    }
    h3 {
      color: #333;
      margin-top: 20px;
    }
    .metadata {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .metadata-item {
      margin: 5px 0;
    }
    .metadata-label {
      font-weight: bold;
      color: #555;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background-color: #0066cc;
      color: white;
      padding: 12px;
      text-align: left;
    }
    td {
      padding: 10px;
      border: 1px solid #ddd;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .summary {
      background-color: #e8f4f8;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .summary h3 {
      margin-top: 0;
      color: #0066cc;
    }
    .finding {
      background-color: #fff;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 15px;
      margin: 15px 0;
    }
    .finding-title {
      font-weight: bold;
      font-size: 1.1em;
      color: #1a1a1a;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #ddd;
      text-align: center;
      color: #777;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <h1>${escapeHTML(reportData.title)}</h1>
`;

  // Description
  if (reportData.description) {
    html += `  <p>${escapeHTML(reportData.description)}</p>\n`;
  }

  // Metadata
  html += `  <div class="metadata">
    <h3>Report Information</h3>
    <div class="metadata-item">
      <span class="metadata-label">Generated:</span> ${escapeHTML(reportData.metadata.generatedAt)}
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Generated By:</span> ${escapeHTML(reportData.metadata.generatedBy)}
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Template:</span> ${escapeHTML(reportData.metadata.template)}
    </div>
`;

  if (reportData.metadata.investigationName) {
    html += `    <div class="metadata-item">
      <span class="metadata-label">Investigation:</span> ${escapeHTML(reportData.metadata.investigationName)}
    </div>
`;
  }

  html += `  </div>\n`;

  // Summary
  if (reportData.summary) {
    html += `  <div class="summary">
    <h3>Executive Summary</h3>
`;

    if (reportData.summary.keyFindings && reportData.summary.keyFindings.length > 0) {
      html += `    <h4>Key Findings:</h4>
    <ul>
`;
      reportData.summary.keyFindings.forEach((finding) => {
        html += `      <li>${escapeHTML(finding)}</li>\n`;
      });
      html += `    </ul>\n`;
    }

    if (reportData.summary.recommendations && reportData.summary.recommendations.length > 0) {
      html += `    <h4>Recommendations:</h4>
    <ul>
`;
      reportData.summary.recommendations.forEach((rec) => {
        html += `      <li>${escapeHTML(rec)}</li>\n`;
      });
      html += `    </ul>\n`;
    }

    if (reportData.summary.conclusion) {
      html += `    <h4>Conclusion:</h4>
    <p>${escapeHTML(reportData.summary.conclusion)}</p>
`;
    }

    html += `  </div>\n`;
  }

  // Sections
  reportData.sections.forEach((section) => {
    html += `  <h2>${escapeHTML(section.title)}</h2>\n`;
    html += renderSectionHTML(section);
  });

  // Footer
  html += `  <div class="footer">
    <p>Generated by OSINT Web Application</p>
    <p>${escapeHTML(new Date().toISOString())}</p>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Render section content as HTML
 */
function renderSectionHTML(section: ReportSection): string {
  let html = '';

  switch (section.type) {
    case 'text':
      html += `  <p>${escapeHTML(String(section.content))}</p>\n`;
      break;

    case 'table':
      const tableContent = section.content as { headers: string[]; rows: string[][] };
      html += `  <table>
    <thead>
      <tr>
`;
      tableContent.headers.forEach((header) => {
        html += `        <th>${escapeHTML(header)}</th>\n`;
      });
      html += `      </tr>
    </thead>
    <tbody>
`;
      tableContent.rows.forEach((row) => {
        html += `      <tr>
`;
        row.forEach((cell) => {
          html += `        <td>${escapeHTML(cell)}</td>\n`;
        });
        html += `      </tr>
`;
      });
      html += `    </tbody>
  </table>
`;
      break;

    case 'findings':
      const findings = section.content as Array<Record<string, unknown>>;
      findings.forEach((finding) => {
        html += `  <div class="finding">
    <div class="finding-title">${escapeHTML(String(finding.title || 'Finding'))}</div>
    <p>${escapeHTML(String(finding.description || ''))}</p>
  </div>
`;
      });
      break;

    default:
      html += `  <pre>${escapeHTML(JSON.stringify(section.content, null, 2))}</pre>\n`;
  }

  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  const div = { textContent: text } as { innerHTML?: string; textContent: string };
  return div.innerHTML || text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
