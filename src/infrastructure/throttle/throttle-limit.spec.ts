import { afterEach, describe, expect, it } from 'vitest';
import { throttleLimit } from './throttle-limit';

const VAR = 'THROTTLE_LIMIT_TEST';

describe('throttleLimit', () => {
  afterEach(() => {
    delete process.env[VAR];
  });

  it('returns the fallback when the variable is unset', () => {
    expect(throttleLimit(VAR, 10)()).toBe(10);
  });

  it('returns the configured value', () => {
    process.env[VAR] = '250';
    expect(throttleLimit(VAR, 10)()).toBe(250);
  });

  it('reads the variable at call time, not at definition time', () => {
    const limit = throttleLimit(VAR, 5);
    expect(limit()).toBe(5);
    process.env[VAR] = '99';
    expect(limit()).toBe(99);
  });

  it.each(['abc', '', '0', '-3', '1.5x'])('falls back for invalid value %j', (value) => {
    process.env[VAR] = value;
    expect(throttleLimit(VAR, 7)()).toBe(7);
  });
});
