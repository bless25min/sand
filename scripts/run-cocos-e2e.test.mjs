import { describe, expect, it, vi } from 'vitest';

import { withCocosPreview } from './run-cocos-e2e.mjs';

describe('withCocosPreview', () => {
  it('closes the programmatic preview even when browser checks fail', async () => {
    const close = vi.fn((callback) => callback());
    const previewFactory = vi.fn(async () => ({
      httpServer: {
        close,
        closeAllConnections: vi.fn(),
      },
    }));

    await expect(
      withCocosPreview(
        {
          port: 49173,
          ensurePortAvailable: vi.fn(async () => undefined),
          previewFactory,
        },
        async () => {
          throw new Error('visual check failed');
        },
      ),
    ).rejects.toThrow('visual check failed');

    expect(close).toHaveBeenCalledOnce();
  });
});
