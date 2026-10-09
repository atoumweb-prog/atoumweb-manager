import { afterAll, describe, expect, it, vi } from 'vitest';

describe('real event-loop handoff with a mocked business clock', () => {
  const instant = new Date('2026-10-06T12:00:00Z');
  afterAll(() => vi.useRealTimers());

  it('leaves a mocked clock active across the shared cleanup hook', () => {
    vi.useFakeTimers();
    vi.setSystemTime(instant);
    expect(vi.isFakeTimers()).toBe(true);
    expect(Date.now()).toBe(instant.getTime());
  });

  it('preserves the clock and lets the test control its own business timers', () => {
    expect(vi.isFakeTimers()).toBe(true);
    expect(Date.now()).toBe(instant.getTime());
    let fired = false;
    setTimeout(() => { fired = true; }, 100);
    expect(fired).toBe(false);
    vi.advanceTimersByTime(100);
    expect(fired).toBe(true);
    expect(Date.now()).toBe(instant.getTime() + 100);
  });
});
