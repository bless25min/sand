import { handleStaticSiteRequest } from '../src/hosting/handle-static-site-request';

interface StaticAssetsBinding {
  fetch(request: Request): Promise<Response>;
}

interface SitesEnvironment {
  ASSETS: StaticAssetsBinding;
}

export default {
  fetch(request: Request, environment: SitesEnvironment): Promise<Response> {
    return handleStaticSiteRequest(request, (assetRequest) =>
      environment.ASSETS.fetch(assetRequest),
    );
  },
};
