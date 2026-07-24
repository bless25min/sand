import { handleStaticSiteRequest } from '../src/hosting/handle-static-site-request';

interface StaticAssetsBinding {
  fetch(request: Request): Promise<Response>;
}

interface SitesEnvironment {
  ASSETS: StaticAssetsBinding;
  API_BASE_URL?: string;
}

export default {
  fetch(request: Request, environment: SitesEnvironment): Promise<Response> {
    return handleStaticSiteRequest(
      request,
      (assetRequest) => environment.ASSETS.fetch(assetRequest),
      { apiBaseUrl: environment.API_BASE_URL },
    );
  },
};
