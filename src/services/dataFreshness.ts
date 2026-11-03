// Lets tab screens skip a refetch when they were loaded moments ago. Any write request (see
// fetchWithAuth in api.ts) marks all cached screen data as changed, so a screen never shows data that
// predates something this user just did. Pull-to-refresh always refetches regardless.

const STALE_AFTER_MS = 30_000;

let lastChangeAt = 0;

export function markDataChanged(): void {
  lastChangeAt = Date.now();
}

// fetchedAt is the Date.now() of the screen's last successful load (0 = never).
export function isFresh(fetchedAt: number): boolean {
  if (!fetchedAt) return false;
  return fetchedAt > lastChangeAt && Date.now() - fetchedAt < STALE_AFTER_MS;
}
