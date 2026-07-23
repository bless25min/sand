import { describe, expect, it } from 'vitest';

import app from './index';

describe('worker api', () => {
  it('reports a machine-readable health state', async () => {
    const response = await app.request('/health');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      service: 'worker-api',
      status: 'ok',
    });
  });
});
