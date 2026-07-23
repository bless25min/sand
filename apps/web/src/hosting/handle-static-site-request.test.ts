import { describe, expect, it, vi } from 'vitest';

import { handleStaticSiteRequest } from './handle-static-site-request';

describe('handleStaticSiteRequest', () => {
  it('returns an existing static asset response unchanged', async () => {
    const request = new Request('https://example.test/assets/game.js');
    const assetResponse = new Response('game bundle', {
      headers: { 'content-type': 'text/javascript' },
      status: 200,
    });
    const fetchAsset = vi.fn(async () => assetResponse);

    const response = await handleStaticSiteRequest(request, fetchAsset);

    expect(fetchAsset).toHaveBeenCalledOnce();
    expect(response).toBe(assetResponse);
  });

  it('serves the app shell when a navigation path has no static file', async () => {
    const request = new Request('https://example.test/expedition/greyfang');
    const fetchAsset = vi.fn(async (assetRequest: Request) => {
      const pathname = new URL(assetRequest.url).pathname;
      return pathname === '/index.html'
        ? new Response('<main>Expedition</main>', { status: 200 })
        : new Response('Not found', { status: 404 });
    });

    const response = await handleStaticSiteRequest(request, fetchAsset);

    expect(fetchAsset).toHaveBeenCalledTimes(2);
    expect(new URL(fetchAsset.mock.calls[1]?.[0].url ?? '').pathname).toBe('/index.html');
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('Expedition');
  });

  it('does not rewrite missing non-GET requests to the app shell', async () => {
    const request = new Request('https://example.test/api/command', { method: 'POST' });
    const missingResponse = new Response('Not found', { status: 404 });
    const fetchAsset = vi.fn(async () => missingResponse);

    const response = await handleStaticSiteRequest(request, fetchAsset);

    expect(fetchAsset).toHaveBeenCalledOnce();
    expect(response).toBe(missingResponse);
  });
});
