/**
 * Pure helpers for the pinned-symbols list. Extracted from
 * `lib/actions/profile.actions.ts` so they can be unit-tested without
 * triggering Next's "Server Actions must be async" rule on the action
 * module.
 */

export const PIN_MAX = 50;

/** Returns the next pinned-list after appending a symbol. Idempotent. */
export function mergePinSymbol(current: string[], symbol: string, max: number = PIN_MAX): string[] {
  if (!symbol) return current;
  if (current.includes(symbol)) return current;
  return [...current, symbol].slice(0, max);
}

/** Returns the next pinned-list after removing a symbol. Idempotent. */
export function mergeUnpinSymbol(current: string[], symbol: string): string[] {
  return current.filter((s) => s !== symbol);
}
