import { ReportResult } from '../reports/types';

function toCSV(report: ReportResult): string {
  const header = report.columns.map((c) => c.label).join(',');
  const lines = report.rows.map((row) =>
    report.columns
      .map((c) => {
        const v = row[c.key];
        if (v === null || v === undefined) return '';
        const s = String(v).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      })
      .join(',')
  );
  return [header, ...lines].join('\n');
}

export function downloadCSV(report: ReportResult, filename?: string) {
  const csv = toCSV(report);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename || report.title}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportReport(report: ReportResult, format: 'pdf' | 'excel' | 'csv') {
  // Minimal viable export: produce CSV for all formats for now.
  // Structure allows swapping implementations later (e.g., jsPDF/XLSX).
  downloadCSV(report);
}

