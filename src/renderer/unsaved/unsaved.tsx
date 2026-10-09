import { createContext, useContext, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { draftFingerprint } from '../../shared/draftSection';
import { UnsavedRegistry } from '../../shared/unsavedRegistry';
export const unsavedRegistry = new UnsavedRegistry();
const Group = createContext('');
export function UnsavedGroup({ name, children }: {
    name: string;
    children: ReactNode;
}) { return <Group.Provider key={name} value={name}>{children}</Group.Provider>; }
export function requestUnsavedExit(run: () => void, group?: string | string[]) { return unsavedRegistry.request(run, (labels, pending) => window.atoumweb.unsaved.confirmExit(labels, pending), group); }
export function useUnsavedDraft<T>(label: string, value: T, options: {
    group?: string;
    ready?: boolean;
    retainWhenHidden?: boolean;
    resetKey?: unknown;
    pending?: boolean;
    dirty?: boolean;
    discard?: (baseline: T) => void;
} = {}) {
    const inherited = useContext(Group), id = useId(), current = draftFingerprint(value), baseline = useRef<{
        hash: string;
        value: T;
    } | null>(null), latest = useRef({ value, options }), [, notify] = useState(0);
    const resetKey = useRef(options.resetKey);
    if (resetKey.current !== options.resetKey) {
        resetKey.current = options.resetKey;
        baseline.current = null;
    }
    const ready = options.ready !== false || !!options.retainWhenHidden && baseline.current !== null;
    latest.current = { value, options };
    if (ready && baseline.current === null)
        baseline.current = { hash: current, value: structuredClone(value) };
    function dirtyNow() { return (latest.current.options.ready !== false || !!latest.current.options.retainWhenHidden && baseline.current !== null) && (latest.current.options.dirty ?? (baseline.current?.hash !== draftFingerprint(latest.current.value))); }
    function discard() { if (baseline.current)
        latest.current.options.discard?.(structuredClone(baseline.current.value)); unsavedRegistry.remove(id); }
    const dirty = dirtyNow();
    useLayoutEffect(() => { if (!ready)
        return; unsavedRegistry.update({ id, group: options.group ?? inherited, label, dirty, pending: !!options.pending, discard }); return () => unsavedRegistry.remove(id); }, [id, inherited, options.group, label, dirty, options.pending, ready, current]);
    return { get dirty() { return dirtyNow(); }, saved: (next: T = value) => { baseline.current = { hash: draftFingerprint(next), value: structuredClone(next) }; notify(n => n + 1); }, initial: (next: T) => { baseline.current = { hash: draftFingerprint(next), value: structuredClone(next) }; notify(n => n + 1); }, request: (run: () => void) => requestUnsavedExit(run, [id]), discard };
}
