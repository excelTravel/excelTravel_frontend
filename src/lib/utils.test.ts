import { describe, it, expect } from 'vitest';
import { cn, formatRWF } from './utils';

describe('cn', () => {
  it('merges class names and resolves Tailwind conflicts (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });
});

describe('formatRWF', () => {
  it('formats a whole amount with thousands grouping and no decimals', () => {
    const out = formatRWF(1234567);
    expect(out).not.toContain('.');
    expect(out.replace(/[^\d,]/g, '')).toBe('1,234,567');
  });

  it('formats zero', () => {
    const out = formatRWF(0);
    expect(out.replace(/[^\d]/g, '')).toBe('0');
  });

  it('rounds down to whole francs (no fractional currency in RWF)', () => {
    const out = formatRWF(999.6);
    expect(out.replace(/[^\d]/g, '')).toBe('1000');
  });
});
