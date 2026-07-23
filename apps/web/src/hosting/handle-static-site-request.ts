export type StaticAssetFetcher = (request: Request) => Promise<Response>;

export async function handleStaticSiteRequest(
  request: Request,
  fetchAsset: StaticAssetFetcher,
): Promise<Response> {
  const assetResponse = await fetchAsset(request);

  if (assetResponse.status !== 404 || request.method !== 'GET') {
    return assetResponse;
  }

  const appShellRequest = new Request(new URL('/index.html', request.url), {
    headers: request.headers,
  });

  return fetchAsset(appShellRequest);
}
