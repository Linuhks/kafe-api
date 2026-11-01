/**
 * Resolves a throttler limit from an environment variable at request time
 * (so values from `.env` loaded by ConfigModule are honoured), falling back to
 * `fallback` when the variable is unset or not a positive integer.
 */
export function throttleLimit(envName: string, fallback: number): () => number {
  return () => {
    const parsed = Number(process.env[envName]);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  };
}
