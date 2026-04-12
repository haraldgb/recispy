import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadChecks, saveChecks, clearChecks, EXPIRY_MS } from '@/lib/checks.js';

describe('checks store', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('returns empty when nothing stored', () => {
    expect(loadChecks(1)).toEqual({ ingredients: [], method: [] });
  });

  it('round-trips state', () => {
    saveChecks(1, { ingredients: [true, false], method: [false, true] });
    expect(loadChecks(1)).toEqual({ ingredients: [true, false], method: [false, true] });
  });

  it('expires after EXPIRY_MS', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    saveChecks(1, { ingredients: [true], method: [] });
    vi.setSystemTime(new Date(Date.now() + EXPIRY_MS + 1000));
    expect(loadChecks(1)).toEqual({ ingredients: [], method: [] });
  });

  it('clearChecks removes the entry', () => {
    saveChecks(1, { ingredients: [true], method: [] });
    clearChecks(1);
    expect(loadChecks(1)).toEqual({ ingredients: [], method: [] });
  });
});
