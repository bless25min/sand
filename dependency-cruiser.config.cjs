/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-unresolvable-imports',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'no-cross-package-deep-imports',
      severity: 'error',
      from: { path: '^(?:apps|packages)/([^/]+)/' },
      to: {
        path: '^packages/(?!$1/)[^/]+/src/',
        pathNot: '^packages/[^/]+/src/index\\.ts$',
      },
    },
    {
      name: 'simulation-core-is-pure',
      severity: 'error',
      from: { path: '^packages/simulation-core/' },
      to: {
        path: '^(apps/|packages/(pixi-renderer|progression-core|command-schema)/|node_modules/(react|react-dom|pixi\\.js|hono|wrangler|@cloudflare/))',
      },
    },
    {
      name: 'renderer-does-not-own-simulation',
      severity: 'error',
      from: { path: '^packages/pixi-renderer/' },
      to: { path: '^packages/simulation-core/' },
    },
    {
      name: 'progression-core-is-ui-free',
      severity: 'error',
      from: { path: '^packages/progression-core/' },
      to: {
        path: '^(apps/|packages/pixi-renderer/|node_modules/(react|react-dom|pixi\\.js|hono|wrangler))',
      },
    },
    {
      name: 'worker-does-not-render',
      severity: 'error',
      from: { path: '^apps/worker-api/' },
      to: { path: '^packages/pixi-renderer/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: '(^|/)dist/',
    includeOnly: '^(apps|packages)',
    tsConfig: { fileName: 'tsconfig.tests.json' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['types', 'import', 'default'],
    },
  },
};
