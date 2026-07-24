export type StaticAssetFetcher = (request: Request) => Promise<Response>;
export type ApiUpstreamFetcher = (request: Request) => Promise<Response>;

export interface StaticSiteRequestOptions {
  apiBaseUrl?: string;
  fetchUpstream?: ApiUpstreamFetcher;
}

export async function handleStaticSiteRequest(
  request: Request,
  fetchAsset: StaticAssetFetcher,
  options: StaticSiteRequestOptions = {},
): Promise<Response> {
  const requestUrl = new URL(request.url);

  if (requestUrl.pathname.startsWith('/api/')) {
    return handleApiRequest(request, requestUrl, options);
  }

  const assetResponse = await fetchAsset(request);

  if (assetResponse.status !== 404 || request.method !== 'GET') {
    return assetResponse;
  }

  const appShellRequest = new Request(new URL('/index.html', request.url), {
    headers: request.headers,
  });

  return fetchAsset(appShellRequest);
}

async function handleApiRequest(
  request: Request,
  requestUrl: URL,
  options: StaticSiteRequestOptions,
): Promise<Response> {
  const upstreamUrl = createUpstreamUrl(requestUrl, options.apiBaseUrl);

  if (!upstreamUrl) {
    return jsonError(
      503,
      options.apiBaseUrl
        ? 'API proxy is unavailable because API_BASE_URL is invalid.'
        : 'API proxy is unavailable because API_BASE_URL is not configured.',
    );
  }

  try {
    return await (options.fetchUpstream ?? fetch)(new Request(upstreamUrl, request));
  } catch {
    return jsonError(502, 'API upstream request failed.');
  }
}

function createUpstreamUrl(requestUrl: URL, apiBaseUrl?: string): URL | undefined {
  if (!apiBaseUrl) {
    return undefined;
  }

  try {
    const upstreamUrl = new URL(apiBaseUrl);

    if (
      (upstreamUrl.protocol !== 'http:' && upstreamUrl.protocol !== 'https:') ||
      upstreamUrl.username ||
      upstreamUrl.password ||
      upstreamUrl.pathname !== '/' ||
      upstreamUrl.search ||
      upstreamUrl.hash
    ) {
      return undefined;
    }

    upstreamUrl.pathname = requestUrl.pathname.slice('/api'.length);
    upstreamUrl.search = requestUrl.search;
    return upstreamUrl;
  } catch {
    return undefined;
  }
}

function jsonError(status: number, error: string): Response {
  return Response.json({ error }, { status });
}
