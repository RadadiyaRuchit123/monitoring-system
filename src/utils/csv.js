/**
 * Utility functions for RFC-4180 compliant CSV generation and browser download execution.
 */

/**
 * Escapes a single string field for CSV compliance:
 * - Wraps field in quotes if it contains commas, double-quotes, or newlines.
 * - Replaces any internal quotes `"` with `""`.
 * @param {any} value
 * @returns {string}
 */
export const escapeCSVField = (value) => {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Converts an array of objects into a formatted CSV string with UTF-8 BOM.
 * @param {Array<string>} headers - Array of header strings
 * @param {Array<Array<any>>} rows - Array of row data arrays matching headers
 * @returns {string}
 */
export const generateCSVString = (headers, rows) => {
  const headerLine = headers.map(escapeCSVField).join(',');
  const rowLines = rows.map((row) => row.map(escapeCSVField).join(','));
  // \uFEFF is the UTF-8 Byte Order Mark (BOM) ensuring Excel displays UTF-8 correctly
  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
};

/**
 * Triggers a browser file download of the CSV content.
 * @param {string} csvContent - The raw CSV string
 * @param {string} filename - Target file name (e.g. checklist-export-2026-08-21.csv)
 */
export const downloadCSVFile = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
