import { createServer } from 'node:net';

import { describe, expect, it } from 'vitest';

import { assertPortAvailable } from './run-e2e.mjs';

describe('assertPortAvailable', () => {
  it('rejects an occupied TCP port', async () => {
    const server = createServer();
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });

    try {
      const address = server.address();
      if (address === null || typeof address === 'string') {
        throw new Error('Expected the test server to bind a TCP port');
      }

      await expect(assertPortAvailable('127.0.0.1', address.port)).rejects.toThrow(
        `E2E preview port 127.0.0.1:${address.port} is already occupied`,
      );
    } finally {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error === undefined) {
            resolve();
            return;
          }
          reject(error);
        });
      });
    }
  });
});
