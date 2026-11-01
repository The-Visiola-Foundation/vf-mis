import { ValueTransformer } from 'typeorm';

/**
 * Postgres returns `numeric`/`decimal` as string. This transformer
 * exposes numbers to the API while storing numerics correctly.
 * Unknown values stay null, never 0.
 */
export const ColumnNumericTransformer: ValueTransformer = {
  to: (value: number | null | undefined) => value ?? null,
  from: (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isNaN(n) ? null : n;
  },
};
