import { handleStaticSiteRequest } from '../src/hosting/handle-static-site-request';

interface StaticAssetsBinding {
  fetch(request: Request): Promise<Response>;
}

interface SitesEnvironment {
  ASSETS: StaticAssetsBinding;
  API_BASE_URL?: string;
}

export const DEFAULT_API_BASE_URL = 'https://project-expedition-api.bless-b53.workers.dev';

export default {
  fetch(request: Request, environment: SitesEnvironment): Promise<Response> {
    return handleStaticSiteRequest(
      request,
      (assetRequest) => environment.ASSETS.fetch(assetRequest),
      { apiBaseUrl: environment.API_BASE_URL ?? DEFAULT_API_BASE_URL },
    );
  },
};
