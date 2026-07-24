import { describe, expect, it, vi } from 'vitest';

import { handleStaticSiteRequest, type ApiUpstreamFetcher } from './handle-static-site-request';

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
    const request = new Request('https://example.test/command', { method: 'POST' });
    const missingResponse = new Response('Not found', { status: 404 });
    const fetchAsset = vi.fn(async () => missingResponse);

    const response = await handleStaticSiteRequest(request, fetchAsset);

    expect(fetchAsset).toHaveBeenCalledOnce();
    expect(response).toBe(missingResponse);
  });

  it('proxies an API POST with its path, query, method, headers, and body unchanged', async () => {
    const request = new Request('https://example.test/api/game-genomes?mode=test', {
      body: JSON.stringify({ seed: 'greyfang' }),
      headers: {
        authorization: 'Bearer player-token',
        'content-type': 'application/json',
      },
      method: 'POST',
    });
    const fetchAsset = vi.fn(async () => new Response('asset'));
    const upstreamResponse = new Response('{"ok":true}', { status: 201 });
    const fetchUpstream = vi.fn<ApiUpstreamFetcher>(async () => upstreamResponse);

    const response = await handleStaticSiteRequest(request, fetchAsset, {
      apiBaseUrl: 'https://api.example.test',
      fetchUpstream,
    });

    expect(fetchAsset).not.toHaveBeenCalled();
    expect(fetchUpstream).toHaveBeenCalledOnce();
    const upstreamRequest = fetchUpstream.mock.calls[0]?.[0] as Request;
    expect(upstreamRequest.url).toBe('https://api.example.test/game-genomes?mode=test');
    expect(upstreamRequest.method).toBe('POST');
    expect(upstreamRequest.headers.get('authorization')).toBe('Bearer player-token');
    expect(upstreamRequest.headers.get('content-type')).toBe('application/json');
    expect(await upstreamRequest.text()).toBe('{"seed":"greyfang"}');
    expect(response).toBe(upstreamResponse);
  });

  it('proxies an API GET after stripping only the API prefix', async () => {
    const request = new Request('https://example.test/api/health');
    const fetchAsset = vi.fn(async () => new Response('asset'));
    const upstreamResponse = new Response('ok');
    const fetchUpstream = vi.fn<ApiUpstreamFetcher>(async () => upstreamResponse);

    const response = await handleStaticSiteRequest(request, fetchAsset, {
      apiBaseUrl: 'https://api.example.test',
      fetchUpstream,
    });

    expect(fetchAsset).not.toHaveBeenCalled();
    expect(fetchUpstream).toHaveBeenCalledOnce();
    expect(fetchUpstream.mock.calls[0]?.[0].url).toBe('https://api.example.test/health');
    expect(response).toBe(upstreamResponse);
  });

  it.each([undefined, 'not a valid URL'])(
    'returns 503 for an API request when the API base is missing or invalid',
    async (apiBaseUrl) => {
      const fetchAsset = vi.fn(async () => new Response('asset'));
      const fetchUpstream = vi.fn<ApiUpstreamFetcher>();
      const options = apiBaseUrl ? { apiBaseUrl, fetchUpstream } : { fetchUpstream };

      const response = await handleStaticSiteRequest(
        new Request('https://example.test/api/health'),
        fetchAsset,
        options,
      );

      expect(fetchAsset).not.toHaveBeenCalled();
      expect(fetchUpstream).not.toHaveBeenCalled();
      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toMatchObject({ error: expect.any(String) });
    },
  );

  it('returns 502 when the API upstream rejects the request', async () => {
    const fetchAsset = vi.fn(async () => new Response('asset'));
    const fetchUpstream = vi.fn<ApiUpstreamFetcher>(async () =>
      Promise.reject(new Error('upstream unavailable')),
    );

    const response = await handleStaticSiteRequest(
      new Request('https://example.test/api/health'),
      fetchAsset,
      {
        apiBaseUrl: 'https://api.example.test',
        fetchUpstream,
      },
    );

    expect(fetchAsset).not.toHaveBeenCalled();
    expect(fetchUpstream).toHaveBeenCalledOnce();
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({ error: expect.any(String) });
  });
});
