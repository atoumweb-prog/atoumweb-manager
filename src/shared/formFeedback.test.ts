import { describe, expect, it } from 'vitest';
import { resolveFormFeedback, type FormFeedbackInput } from './formFeedback';
import { mergeDraft } from './draftSection';

const feedback = (value: FormFeedbackInput) => resolveFormFeedback(value);
describe('UX V2 01E — scoped form feedback, without implicit saves', () => {
  it('starts clean without claiming an unconfirmed save', () => {
    expect(feedback({ dirty: false })).toMatchObject({ kind: 'clean', level: 'info' });
  });
  it('shows dirty editor instead of an old success', () => {
    expect(feedback({ dirty: true, serviceConfirmed: true })).toMatchObject({ kind: 'dirty', level: 'warning' });
  });
  it('does not call pending a success even with a previous acknowledgment', () => {
    expect(feedback({ dirty: false, pending: true, serviceConfirmed: true })).toMatchObject({ kind: 'pending' });
  });
  it('reports failed saves and preserves the dirty signal', () => {
    expect(feedback({ dirty: true, error: true, serviceConfirmed: true })).toMatchObject({ kind: 'error', level: 'error' });
  });
  it('requires conflict resolution even if a previous save was acknowledged', () => {
    expect(feedback({ dirty: true, conflict: true, serviceConfirmed: true })).toMatchObject({ kind: 'conflict', level: 'error' });
  });
  it('prioritizes conflict over pending or generic failure', () => {
    expect(feedback({ dirty: true, conflict: true, pending: true, error: true })).toMatchObject({ kind: 'conflict' });
  });
  it('prioritizes pending over a stale error from the previous attempt', () => {
    expect(feedback({ dirty: true, pending: true, error: true })).toMatchObject({ kind: 'pending' });
  });
  it('reports saved only after an explicit service acknowledgement with no blockers', () => {
    expect(feedback({ dirty: false, pending: false, error: false, conflict: false, serviceConfirmed: true }))
      .toMatchObject({ kind: 'saved', level: 'success' });
  });
  it('does not mutate inputs or track any editor globally', () => {
    const input: FormFeedbackInput = Object.freeze({ dirty: true, pending: false, serviceConfirmed: true });
    const first = feedback(input);
    expect(feedback(input)).toEqual(first);
    expect(input).toEqual({ dirty: true, pending: false, serviceConfirmed: true });
  });
  it('checks all 32 combinations: no stale save acknowledgement can mask blockers', () => {
    const states = ['dirty', 'pending', 'error', 'conflict', 'serviceConfirmed'] as const;
    for (let mask = 0; mask < 32; mask++) {
      const input = Object.fromEntries(states.map((state, index) => [state, Boolean(mask & (1 << index))]))
        as unknown as FormFeedbackInput;
      const state = feedback(input);
      const expected = input.conflict ? 'conflict'
        : input.pending ? 'pending'
        : input.error ? 'error'
        : input.dirty ? 'dirty'
        : input.serviceConfirmed ? 'saved'
        : 'clean';
      expect(state.kind, `combination #${mask}`).toBe(expected);
      expect(state.kind === 'saved', `combination #${mask}`).toBe(
        input.serviceConfirmed === true && !input.dirty && !input.pending && !input.error && !input.conflict,
      );
    }
  });
  it('preserves the local draft and records a real three-way conflict', () => {
    const merged = mergeDraft({ note: 'baseline' }, { note: 'local edit' }, { note: 'remote edit' });
    expect(merged.value).toEqual({ note: 'local edit' });
    expect(merged.conflicts).toEqual(['note']);
  });
  it('accepts a remote note only when no local modification exists', () => {
    const merged = mergeDraft({ note: 'baseline' }, { note: 'baseline' }, { note: 'remote edit' });
    expect(merged.value).toEqual({ note: 'remote edit' });
    expect(merged.conflicts).toEqual([]);
  });
  it('provides explicit messages for every state', () => {
    for (const input of [
      { dirty: false }, { dirty: true }, { dirty: false, pending: true },
      { dirty: true, error: true }, { dirty: true, conflict: true },
      { dirty: false, serviceConfirmed: true },
    ]) {
      expect(feedback(input).text.length).toBeGreaterThan(12);
    }
  });
});
