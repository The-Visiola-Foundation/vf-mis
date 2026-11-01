/**
 * Pure year roll-up helpers. Rules:
 * - Sum counts and spend.
 * - Count unique participants once across camps.
 * - Recompute means from pooled raw counts weighted by n.
 * - Never average two camps' means or percentages; never combine p-values.
 * - Unknown values are null, never 0. Year roll-ups use core measures only.
 */

export type CampMeanInput = { mean: number | null; n: number | null };

export function pooledMean(inputs: CampMeanInput[]): number | null {
  let num = 0;
  let den = 0;
  for (const { mean, n } of inputs ?? []) {
    if (
      mean === null ||
      mean === undefined ||
      n === null ||
      n === undefined ||
      n <= 0
    )
      continue;
    num += mean * n;
    den += n;
  }
  if (den <= 0) return null;
  return num / den;
}

export function sumCounts(
  values: Array<number | null | undefined>,
): number | null {
  let total = 0;
  let seen = false;
  for (const v of values ?? []) {
    if (v === null || v === undefined) continue;
    total += v;
    seen = true;
  }
  return seen ? total : null;
}

export function uniqueCount<T>(lists: T[][]): number {
  return new Set(
    (lists ?? []).flat().filter((v) => v !== null && v !== undefined),
  ).size;
}

/** Percentage derived from stored counts only. Null when denominator missing/zero. */
export function pctFromCounts(
  part: number | null | undefined,
  whole: number | null | undefined,
): number | null {
  if (
    part === null ||
    part === undefined ||
    whole === null ||
    whole === undefined ||
    whole <= 0
  )
    return null;
  return (part / whole) * 100;
}
