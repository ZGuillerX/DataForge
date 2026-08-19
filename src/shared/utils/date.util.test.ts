import { formatDate, addSeconds, isExpired } from './date.util';

describe('formatDate', () => {
  it('formats a UTC date as "YYYY-MM-DD HH:mm:ss"', () => {
    const date = new Date('2026-01-15T10:30:00.000Z');
    expect(formatDate(date)).toBe('2026-01-15 10:30:00');
  });
});

describe('addSeconds', () => {
  it('adds seconds to a date', () => {
    const date = new Date('2026-01-15T10:00:00.000Z');
    const result = addSeconds(date, 90);
    expect(result.toISOString()).toBe('2026-01-15T10:01:30.000Z');
  });

  it('subtracts seconds when given a negative value', () => {
    const date = new Date('2026-01-15T10:01:30.000Z');
    const result = addSeconds(date, -90);
    expect(result.toISOString()).toBe('2026-01-15T10:00:00.000Z');
  });
});

describe('isExpired', () => {
  it('returns true for a date in the past', () => {
    expect(isExpired(new Date('2000-01-01T00:00:00.000Z'))).toBe(true);
  });

  it('returns false for a date far in the future', () => {
    expect(isExpired(new Date('2100-01-01T00:00:00.000Z'))).toBe(false);
  });
});
