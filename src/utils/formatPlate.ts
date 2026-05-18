/**
 * Formats an Indian vehicle registration number as "MH 09 HG 7777".
 * Strips existing spaces before formatting, returns the cleaned string
 * as-is if the pattern doesn't match (e.g. partial input while typing).
 */
export function formatPlateNumber(raw: string): string {
  const clean = raw.replace(/\s+/g, '').toUpperCase();
  const match = clean.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{1,4})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }
  return clean;
}
