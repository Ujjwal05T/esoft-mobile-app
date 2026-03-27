const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

function toIST(utcDateStr: string | null | undefined): Date | null {
  if (!utcDateStr) return null;
  return new Date(new Date(utcDateStr).getTime() + IST_OFFSET_MS);
}

/** "15 Jan 2024" */
export function formatDateIST(
  utcDateStr: string | null | undefined,
  fallback = '–',
): string {
  const d = toIST(utcDateStr);
  if (!d) return fallback;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "15 January 2024, 3:30 PM" */
export function formatDateTimeIST(
  utcDateStr: string | null | undefined,
  fallback = '–',
): string {
  const d = toIST(utcDateStr);
  if (!d) return fallback;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** "03:30 PM" */
export function formatTimeIST(
  utcDateStr: string | null | undefined,
  fallback = '',
): string {
  const d = toIST(utcDateStr);
  if (!d) return fallback;
  return d.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'});
}

/** "15/01/2024" */
export function formatDeliveryDateIST(
  utcDateStr: string | null | undefined,
  fallback = '–',
): string {
  const d = toIST(utcDateStr);
  if (!d) return fallback;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
