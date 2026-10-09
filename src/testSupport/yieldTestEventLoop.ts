import { setImmediate as realSetImmediate } from 'node:timers';
import { afterEach } from 'vitest';

// Synchronous suites must let the worker receive RPC acknowledgements between tests.
// Node's real timer keeps this handoff independent of a test's mocked clock.
afterEach(async () => {
  await new Promise<void>(resolve => realSetImmediate(resolve));
});
