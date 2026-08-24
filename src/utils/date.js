/**
 * Date/Time Formatting Utilities for Local Timezone Display
 */

/**
 * Formats a timestamp into human-readable local date & time.
 * Example output: "21 Aug 2026 • 10:42 PM"
 * @param {string|Date|null} timestamp
 * @returns {string}
 */
export const formatDateTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid date';

  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // hour 0 is 12 AM

  return `${day} ${month} ${year} • ${hours}:${minutes} ${ampm}`;
};

/**
 * Formats a timestamp into local time string.
 * Example output: "10:42 PM"
 * @param {string|Date|null} timestamp
 * @returns {string}
 */
export const formatTimeOnly = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${hours}:${minutes} ${ampm}`;
};

/**
 * Formats a timestamp into ISO-like CSV export standard string YYYY-MM-DD HH:mm
 * Example output: "2026-08-21 22:42"
 * @param {string|Date|null} timestamp
 * @returns {string}
 */
export const formatCSVDateTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * Returns current date formatted as YYYY-MM-DD for dynamic export filenames.
 * Example: "2026-08-21"
 * @returns {string}
 */
export const getTodayDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};
