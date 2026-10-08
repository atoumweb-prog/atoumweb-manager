import { describe, expect, it } from 'vitest';
import { calculateBridgePackageFingerprint } from './BridgeSnapshotPackage';

describe('Bridge Snapshot fingerprint', () => {
  it('suit le contrat path + tab + sha256 hex + LF trié lexicalement', () => {
    const fingerprint = calculateBridgePackageFingerprint({
      'b.txt': `sha256:${'b'.repeat(64)}`,
      'a.txt': `sha256:${'a'.repeat(64)}`,
    });
    expect(fingerprint).toBe('sha256:2f6dd8172b9f70f8a8ff9df60c589e9fcc33b6d33a58d927edff51deb12938f9');
  });
});
