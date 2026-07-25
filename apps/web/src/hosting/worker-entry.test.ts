import { afterEach, describe, expect, it, vi } from 'vitest';

import worker from '../../worker/index';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('production Pages worker entry', () => {
  it('proxies API requests to the deployed Worker when no override is configured', async () => {
    const fetchUpstream = vi.fn(async (request: Request) => {
      expect(request.method).toBe('GET');
      return Response.json({ service: 'worker-api', status: 'ok' });
    });
    vi.stubGlobal('fetch', fetchUpstream);
    const fetchAsset = vi.fn(async () => new Response('asset'));

    const response = await worker.fetch(new Request('https://game.example/api/health'), {
      ASSETS: { fetch: fetchAsset },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      service: 'worker-api',
      status: 'ok',
    });
    expect(fetchAsset).not.toHaveBeenCalled();
    expect(fetchUpstream).toHaveBeenCalledOnce();
    expect(fetchUpstream.mock.calls[0]?.[0].url).toBe(
      'https://project-expedition-api.bless-b53.workers.dev/health',
    );
  });
});
