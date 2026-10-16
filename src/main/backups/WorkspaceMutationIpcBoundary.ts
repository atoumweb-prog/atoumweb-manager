/**
 * EC04 opt-in adapter for main-process mutating IPC boundaries.
 * Do not register a handler with this wrapper and call it a globally safe
 * backup: every mutating IPC / background task must be inventoried separately.
 */
import type {WorkspaceMutationGate} from './WorkspaceMutationGate';

/** Wrap exactly one complete async operation (FS + SQLite), including its result. */
export function guardIpcMutation<TArgs extends unknown[], TResult>(
  gate: WorkspaceMutationGate,
  handler: (...args: TArgs) => TResult | Promise<TResult>,
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => gate.runMutation(() => handler(...args));
}
