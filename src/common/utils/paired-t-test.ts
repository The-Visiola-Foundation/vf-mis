import { jStat } from 'jstat';

/**
 * Paired two-tailed t-test p-value.
 * Returns null when there are fewer than 2 matched pairs
 * or zero variance (unknown, never 0).
 */
export function pairedTTestPValue(
  pairs: Array<{ a: number | null; b: number | null }>,
): number | null {
  const diffs = (pairs ?? [])
    .filter(
      (p) =>
        p &&
        p.a !== null &&
        p.a !== undefined &&
        p.b !== null &&
        p.b !== undefined,
    )
    .map((p) => (p.b as number) - (p.a as number));
  const n = diffs.length;
  if (n < 2) return null;
  const mean = diffs.reduce((s, d) => s + d, 0) / n;
  const variance = diffs.reduce((s, d) => s + (d - mean) ** 2, 0) / (n - 1);
  if (variance <= 0) return null;
  const t = mean / Math.sqrt(variance / n);
  const p = 2 * (1 - jStat.studentt.cdf(Math.abs(t), n - 1));
  if (!Number.isFinite(p)) return null;
  return Math.min(1, Math.max(0, p));
}

export function isSignificant(
  pValue: number | null,
  alpha = 0.05,
): boolean | null {
  if (pValue === null || pValue === undefined) return null;
  return pValue < alpha;
}


export function camelToWords(input: string): string {
  return input
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}