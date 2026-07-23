# Batch 01 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build TASK-001 through TASK-003 as a runnable pnpm monorepo with enforceable package boundaries, deterministic seeded randomness, and a pure battle-state foundation.

**Architecture:** Use a modular monolith with package-level ports and adapters. `shared-types` owns only stable cross-package contracts, `simulation-core` owns deterministic rules, apps are thin composition roots, and dependency-cruiser plus TypeScript Project References enforce the direction described in the approved design.

**Tech Stack:** Node.js 22, pnpm 11, TypeScript 6, React 19, Vite 8, Vitest 4, fast-check 4, Hono 4, Wrangler 4, ESLint 10, Prettier 3, dependency-cruiser 18, Knip 6.

## Global Constraints

- `docs/AI_DEVELOPMENT_SPEC.md` is the highest product and technical authority.
- Do not use `Math.random`.
- Simulation code must not import React, PixiJS, HTTP, Cloudflare SDKs, Worker code, or AI models.
- Rendering and UI must not own battle results.
- Every production behavior starts with a failing test and follows red-green-refactor.
- Functions receive the smallest useful input and return named results.
- Only a thin composition root may know multiple feature modules.
- Use AHA: do not extract a shared abstraction until semantics and change reasons are actually shared.
- Use TypeScript strict mode.
- Do not add multiplayer, Durable Objects, D1, R2, Workers AI, or narrative systems in this batch.
- Do not commit directly to `main`; create and use `codex/project-expedition-mvp`.

---

## Task 1: Establish the workspace and executable architecture

**Files:**

- Create: `.gitignore`
- Create: `.npmrc`
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `tsconfig.json`
- Create: `eslint.config.mjs`
- Create: `prettier.config.mjs`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `dependency-cruiser.config.cjs`
- Create: `knip.json`
- Create: `AGENTS.md`
- Create: `docs/architecture/C4_COMPONENTS.md`
- Create: `docs/adr/0001-modular-monolith-boundaries.md`

**Interfaces:**

- Consumes: Node.js `>=22.12.0`, pnpm `11.9.0`, and the approved batch design.
- Produces: root commands `dev`, `build`, `typecheck`, `test`, `test:e2e`, `lint`, `format:check`, `arch:check`, `arch:graph`, `deadcode`, and `check`.

- [ ] **Step 1: Create the feature branch**

Run:

```powershell
git switch -c codex/project-expedition-mvp
```

Expected: current branch becomes `codex/project-expedition-mvp`.

- [ ] **Step 2: Create the root workspace manifest**

Create `package.json`:

```json
{
  "name": "project-expedition",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@11.9.0",
  "engines": {
    "node": ">=22.12.0"
  },
  "scripts": {
    "dev": "pnpm --parallel --filter @expedition/web --filter @expedition/worker-api dev",
    "build": "pnpm -r --if-present build",
    "typecheck": "tsc -b --pretty false",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "arch:check": "depcruise --config dependency-cruiser.config.cjs apps packages",
    "arch:graph": "depcruise --config dependency-cruiser.config.cjs --output-type dot apps packages",
    "deadcode": "knip",
    "check": "pnpm typecheck && pnpm lint && pnpm format:check && pnpm arch:check && pnpm deadcode && pnpm test && pnpm build"
  },
  "devDependencies": {
    "@eslint/js": "10.0.1",
    "@playwright/test": "1.61.1",
    "@types/node": "26.1.1",
    "@types/react": "19.2.17",
    "@types/react-dom": "19.2.3",
    "@vitejs/plugin-react": "6.0.4",
    "dependency-cruiser": "18.1.0",
    "eslint": "10.7.0",
    "fast-check": "4.9.0",
    "knip": "6.29.0",
    "prettier": "3.9.6",
    "typescript": "6.0.3",
    "typescript-eslint": "8.65.0",
    "vite": "8.1.5",
    "vitest": "4.1.10",
    "wrangler": "4.113.0"
  }
}
```

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - apps/*
  - packages/*
allowBuilds:
  esbuild: true
  sharp: true
  workerd: true
minimumReleaseAgeExclude:
  - '@vitejs/plugin-react@6.0.4'
  - knip@6.29.0
```

Create `.npmrc`:

```ini
link-workspace-packages=true
prefer-workspace-packages=true
save-exact=true
```

Create `.gitignore`:

```gitignore
node_modules/
dist/
coverage/
playwright-report/
test-results/
*.tsbuildinfo
.wrangler/
.dev.vars
.env
.env.*
!.env.example
docs/architecture/dependency-graph.dot
```

- [ ] **Step 3: Create TypeScript solution configuration**

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

Create `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./packages/shared-types" },
    { "path": "./packages/simulation-core" },
    { "path": "./packages/game-data" },
    { "path": "./packages/command-schema" },
    { "path": "./packages/pixi-renderer" },
    { "path": "./packages/progression-core" },
    { "path": "./packages/test-fixtures" },
    { "path": "./apps/web" },
    { "path": "./apps/worker-api" }
  ]
}
```

- [ ] **Step 4: Create lint, format, and test configuration**

Create `eslint.config.mjs`:

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
);
```

Create `prettier.config.mjs`:

```javascript
export default {
  printWidth: 100,
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
};
```

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['apps/**/src/**/*.test.{ts,tsx}', 'packages/**/src/**/*.test.ts'],
    passWithNoTests: false,
    reporters: ['default'],
  },
});
```

Create `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './apps/web/e2e',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm --filter @expedition/web preview --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
  },
});
```

- [ ] **Step 5: Create architecture and dead-code checks**

Create `dependency-cruiser.config.cjs`:

```javascript
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
      name: 'no-deep-workspace-imports',
      severity: 'error',
      from: { path: '^(apps|packages)/' },
      to: { via: '^@expedition/[^/]+/.+' },
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
    includeOnly: '^(apps|packages)',
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['types', 'import', 'default'],
    },
  },
};
```

Create `knip.json`:

```json
{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  "entry": ["eslint.config.mjs", "playwright.config.ts", "prettier.config.mjs", "vitest.config.ts"],
  "project": ["*.{ts,mts,cts,js,mjs,cjs}"],
  "workspaces": {
    "apps/web": {
      "entry": ["src/main.tsx", "vite.config.ts"],
      "project": ["src/**/*.{ts,tsx}", "e2e/**/*.ts", "vite.config.ts"]
    },
    "apps/worker-api": {
      "entry": ["src/index.ts"],
      "project": ["src/**/*.ts"]
    },
    "packages/shared-types": {
      "entry": ["src/index.ts"],
      "project": ["src/**/*.ts"]
    },
    "packages/simulation-core": {
      "entry": ["src/index.ts"],
      "project": ["src/**/*.ts"]
    },
    "packages/game-data": {
      "entry": ["src/index.ts"],
      "project": ["src/**/*.ts"]
    },
    "packages/command-schema": {
      "entry": ["src/index.ts"],
      "project": ["src/**/*.ts"]
    },
    "packages/pixi-renderer": {
      "entry": ["src/index.ts"],
      "project": ["src/**/*.ts"]
    },
    "packages/progression-core": {
      "entry": ["src/index.ts"],
      "project": ["src/**/*.ts"]
    },
    "packages/test-fixtures": {
      "entry": ["src/index.ts"],
      "project": ["src/**/*.ts"]
    }
  }
}
```

- [ ] **Step 6: Create concise human and AI architecture guidance**

Create `AGENTS.md`:

```markdown
# Project Expedition Development Rules

## Authority

1. `docs/AI_DEVELOPMENT_SPEC.md`
2. Approved design documents under `docs/superpowers/specs/`
3. Approved implementation plans under `docs/superpowers/plans/`

## Boundaries

- Keep simulation rules in `packages/simulation-core`.
- Keep cross-package stable contracts only in `packages/shared-types`.
- React, PixiJS, Worker routes, HTTP, and AI adapters must not own battle outcomes.
- Import workspace packages through `@expedition/<package>`, never through another package's `src`.
- Prefer feature-local types until a second package needs the contract.
- Only thin composition roots may coordinate multiple feature modules.
- Do not use `Math.random`; inject `RandomSource`.
- Preserve military-order conflicts and generate traceable events for major results.

## Change Standard

- Split by independent testability, single responsibility, and explicit input/output.
- Use AHA; do not create shared abstractions for coincidental similarity.
- Add a failing test before production behavior.
- Run local checks first, then `pnpm check` at batch completion.

## Commands

- `pnpm dev`
- `pnpm test`
- `pnpm typecheck`
- `pnpm arch:check`
- `pnpm deadcode`
- `pnpm check`
```

Create `docs/architecture/C4_COMPONENTS.md`:

````markdown
# Project Expedition C4 Containers and Components

## Containers

- Web Client: React composition, fixed command UI, management UI, and PixiJS battlefield.
- Worker API: HTTP boundary for future saves and AI adapters.

## Components

```text
Web Client
├─ command-schema
├─ simulation-core
├─ progression-core
├─ pixi-renderer
├─ game-data
└─ shared-types

Worker API
├─ command-schema
└─ shared-types
```

## Dependency Rule

Adapters depend on stable contracts and pure cores. Pure cores never depend on adapters.
````

Create `docs/adr/0001-modular-monolith-boundaries.md`:

```markdown
# ADR 0001: Use enforceable modular-monolith boundaries

## Status

Accepted.

## Context

The game combines deterministic simulation, rendering, progression, content, UI, and future AI adapters. A change in one area must not silently alter another area.

## Decision

Use a pnpm modular monolith with Hexagonal Architecture at external boundaries, Vertical Slices inside feature packages, and a Functional Core with thin imperative composition roots. Enforce package direction with TypeScript Project References, package exports, dependency-cruiser, and Knip.

## Alternatives

- A single application package was rejected because it does not protect rule ownership.
- Microservices were rejected because the single-player MVP does not need network boundaries.
- Nx was deferred because eight packages do not justify its additional project model.

## Consequences

- Each package needs a small public contract and README.
- Cross-package changes become explicit compile-time or architecture-check failures.
- Some local duplication is accepted until a stable shared abstraction exists.
```

- [ ] **Step 7: Install the locked toolchain**

Run:

```powershell
pnpm.cmd install
```

Expected: `pnpm-lock.yaml` is created and installation succeeds without peer-dependency errors.

- [ ] **Step 8: Checkpoint the workspace configuration**

Run:

```powershell
git add .gitignore .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json eslint.config.mjs prettier.config.mjs vitest.config.ts playwright.config.ts dependency-cruiser.config.cjs knip.json AGENTS.md docs
git commit -m "chore: establish project expedition architecture"
```

Expected: one commit on `codex/project-expedition-mvp`.

---

## Task 2: Scaffold apps and focused package contracts

**Files:**

- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/README.md`
- Create: `apps/worker-api/package.json`
- Create: `apps/worker-api/tsconfig.json`
- Create: `apps/worker-api/wrangler.jsonc`
- Create: `apps/worker-api/README.md`
- Create: `packages/*/package.json`
- Create: `packages/*/tsconfig.json`
- Create: `packages/*/src/index.ts`
- Create: `packages/*/README.md`

**Interfaces:**

- Consumes: root workspace scripts and TypeScript base configuration.
- Produces: nine independently addressable projects with `@expedition/*` package names and stable root entry points.

- [ ] **Step 1: Create web and Worker manifests**

Create `apps/web/package.json`:

```json
{
  "name": "@expedition/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "19.2.8",
    "react-dom": "19.2.8"
  }
}
```

Create `apps/worker-api/package.json`:

```json
{
  "name": "@expedition/worker-api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "types": "wrangler types worker-configuration.d.ts",
    "build": "pnpm types && wrangler deploy --dry-run --outdir dist"
  },
  "dependencies": {
    "hono": "4.12.31"
  }
}
```

- [ ] **Step 2: Create app TypeScript and runtime configuration**

Create `apps/web/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "tsBuildInfoFile": "../../node_modules/.cache/web.tsbuildinfo"
  },
  "include": ["src", "vite.config.ts"]
}
```

Create `apps/web/vite.config.ts`:

```typescript
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
});
```

Create `apps/web/index.html`:

```html
<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Project Expedition</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `apps/worker-api/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "noEmit": true,
    "lib": ["ES2022"],
    "tsBuildInfoFile": "../../node_modules/.cache/worker-api.tsbuildinfo"
  },
  "include": ["src", "worker-configuration.d.ts"]
}
```

Create `apps/worker-api/wrangler.jsonc`:

```jsonc
{
  "$schema": "../../node_modules/wrangler/config-schema.json",
  "name": "project-expedition-api",
  "main": "src/index.ts",
  "compatibility_date": "2026-07-23",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true,
    "logs": {
      "head_sampling_rate": 1,
    },
    "traces": {
      "enabled": true,
      "head_sampling_rate": 0.01,
    },
  },
}
```

- [ ] **Step 3: Create focused library manifests**

For each package in the table, create the listed `package.json`. Do not add a dependency until source code imports it.

| Directory                   | Package name                   |
| --------------------------- | ------------------------------ |
| `packages/shared-types`     | `@expedition/shared-types`     |
| `packages/simulation-core`  | `@expedition/simulation-core`  |
| `packages/game-data`        | `@expedition/game-data`        |
| `packages/command-schema`   | `@expedition/command-schema`   |
| `packages/pixi-renderer`    | `@expedition/pixi-renderer`    |
| `packages/progression-core` | `@expedition/progression-core` |
| `packages/test-fixtures`    | `@expedition/test-fixtures`    |

Each manifest uses the JSON shape below. Its `name` value must be the exact package name
listed for that directory in the table above; every other field is identical.

```json
{
  "name": "@expedition/shared-types",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "files": ["dist"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -b",
    "typecheck": "tsc -b --pretty false"
  }
}
```

Create this `tsconfig.json` in each library package:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "tsBuildInfoFile": "dist/.tsbuildinfo"
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts"]
}
```

Create an empty public entry point in packages without batch-one behavior:

```typescript
export {};
```

- [ ] **Step 4: Create package contract READMEs**

Each README must contain the headings `Responsibility`, `Public Input`, `Public Output`,
`Allowed Dependencies`, and `Forbidden Responsibilities`, using the exact contract row below.

| README                                | Responsibility                                   | Public Input                                       | Public Output                                              | Allowed Dependencies                                           | Forbidden Responsibilities                       |
| ------------------------------------- | ------------------------------------------------ | -------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ |
| `packages/shared-types/README.md`     | Stable cross-package serializable contracts      | Plain serializable values                          | TypeScript types only                                      | None                                                           | Behavior, framework imports, mutable state       |
| `packages/simulation-core/README.md`  | Deterministic battle rules and invariants        | Shared contracts, commands, `RandomSource`         | State updates and `BattleEvent` values                     | `@expedition/shared-types`                                     | React, PixiJS, HTTP, Worker, AI, persistence     |
| `packages/game-data/README.md`        | Greyfang Forest content definitions              | Author-authored static definitions                 | Domain, monster, unit, item, and recipe definitions        | `@expedition/shared-types`                                     | Formulas, mutable player state, rendering        |
| `packages/command-schema/README.md`   | Command contracts and untrusted-input validation | Raw command payloads                               | Validated `UnitOrder` data or structured validation errors | `@expedition/shared-types`, Zod when command validation begins | Battle outcomes and direct state mutation        |
| `packages/pixi-renderer/README.md`    | Visual projection and PixiJS lifecycle           | Read-only visual snapshots and events              | Canvas visuals and selection signals                       | `@expedition/shared-types`, PixiJS when rendering begins       | Casualties, morale, loot, or simulation mutation |
| `packages/progression-core/README.md` | Loot, inventory, crafting, and equipment effects | Battle results, recipes, inventory, `RandomSource` | Progression state updates and events                       | `@expedition/shared-types`                                     | React, PixiJS, HTTP, battle simulation           |
| `packages/test-fixtures/README.md`    | Deterministic reusable test states               | Fixture parameters                                 | Valid shared contracts and replay fixtures                 | `@expedition/shared-types`                                     | Production behavior                              |
| `apps/web/README.md`                  | Client UI and composition root                   | Player input and package outputs                   | Browser UI and adapter calls                               | Public `@expedition/*` entries used by the client              | Battle formulas and direct persistence           |
| `apps/worker-api/README.md`           | HTTP and future external-service adapters        | HTTP requests                                      | Validated HTTP responses                                   | `@expedition/shared-types`, `@expedition/command-schema`, Hono | Rendering and client simulation                  |

- [ ] **Step 5: Install app dependencies and verify project discovery**

Run:

```powershell
pnpm.cmd install
pnpm.cmd --filter @expedition/worker-api types
pnpm.cmd list --depth 0
```

Expected: both apps and all seven packages are discovered without duplicate workspace names,
and Wrangler creates `apps/worker-api/worker-configuration.d.ts` from `wrangler.jsonc`.

- [ ] **Step 6: Checkpoint the package boundaries**

Run:

```powershell
git add apps packages package.json pnpm-lock.yaml tsconfig.json
git commit -m "chore: scaffold expedition apps and packages"
```

Expected: package scaffolding is committed without production game rules.

---

## Task 3: Add tested web and Worker entry points

**Files:**

- Create: `apps/web/src/App.test.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/styles.css`
- Create: `apps/worker-api/src/index.test.ts`
- Create: `apps/worker-api/src/index.ts`

**Interfaces:**

- Consumes: React and Hono.
- Produces: `App(): ReactElement` and a default Hono app with `GET /health`.

- [ ] **Step 1: Write failing app-shell tests**

Create `apps/web/src/App.test.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('identifies the Project Expedition development shell', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Project Expedition');
    expect(markup).toContain('遠征軍戰術沙盤');
  });
});
```

Create `apps/worker-api/src/index.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import app from './index';

describe('worker api', () => {
  it('reports a machine-readable health state', async () => {
    const response = await app.request('/health');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      service: 'worker-api',
      status: 'ok',
    });
  });
});
```

- [ ] **Step 2: Run tests and verify the expected red state**

Run:

```powershell
pnpm.cmd test
```

Expected: tests fail because `./App` and `./index` do not exist.

- [ ] **Step 3: Implement the minimal React shell**

Create `apps/web/src/App.tsx`:

```tsx
export function App() {
  return (
    <main className="app-shell">
      <p className="eyebrow">AI 魔獸領域遠征軍團 RPG</p>
      <h1>Project Expedition</h1>
      <p>遠征軍戰術沙盤</p>
    </main>
  );
}
```

Create `apps/web/src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import './styles.css';

const root = document.getElementById('root');

if (root === null) {
  throw new Error('Missing #root mount element');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Create `apps/web/src/styles.css`:

```css
:root {
  color: #ece6d8;
  background: #121712;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

.app-shell {
  display: grid;
  min-height: 100vh;
  place-content: center;
  padding: 2rem;
  text-align: center;
}

.eyebrow {
  color: #b8a36a;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(2.5rem, 8vw, 6rem);
}
```

- [ ] **Step 4: Implement the minimal Worker shell**

Create `apps/worker-api/src/index.ts`:

```typescript
import { Hono } from 'hono';

const app = new Hono();

app.get('/health', (context) =>
  context.json({
    service: 'worker-api',
    status: 'ok',
  }),
);

export default app;
```

- [ ] **Step 5: Run tests and builds**

Run:

```powershell
pnpm.cmd test
pnpm.cmd --filter @expedition/web build
pnpm.cmd --filter @expedition/worker-api build
```

Expected: both tests pass, Vite emits `apps/web/dist`, and Wrangler dry-run emits `apps/worker-api/dist`.

- [ ] **Step 6: Checkpoint the runnable shells**

Run:

```powershell
git add apps/web apps/worker-api
git commit -m "feat: add runnable web and worker shells"
```

---

## Task 4: Build the Seeded RNG through property tests

**Files:**

- Create: `packages/simulation-core/src/rng/random-source.ts`
- Create: `packages/simulation-core/src/rng/seeded-random.test.ts`
- Create: `packages/simulation-core/src/rng/seeded-random.ts`
- Modify: `packages/simulation-core/src/index.ts`

**Interfaces:**

- Consumes: a non-empty or empty string seed.
- Produces: `RandomSource`, `SeededRandom`, and `createSeededRandom(seed: string): RandomSource`.

- [ ] **Step 1: Write the interface and failing deterministic tests**

Create `packages/simulation-core/src/rng/random-source.ts`:

```typescript
export interface RandomSource {
  next(): number;
  nextInt(minimum: number, maximum: number): number;
}
```

Create `packages/simulation-core/src/rng/seeded-random.test.ts`:

```typescript
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { createSeededRandom } from './seeded-random';

function take(seed: string, count: number): number[] {
  const random = createSeededRandom(seed);
  return Array.from({ length: count }, () => random.next());
}

describe('createSeededRandom', () => {
  it('returns the same 100 values for the same seed', () => {
    expect(take('greyfang', 100)).toEqual(take('greyfang', 100));
  });

  it('returns a different sequence for known different seeds', () => {
    expect(take('greyfang', 10)).not.toEqual(take('hornback', 10));
  });

  it('keeps next values inside the half-open unit interval', () => {
    fc.assert(
      fc.property(fc.string(), fc.integer({ min: 1, max: 200 }), (seed, count) => {
        const values = take(seed, count);
        expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
      }),
    );
  });

  it('keeps nextInt values inside the inclusive integer range', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.integer({ min: -1000, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (seed, minimum, width) => {
          const maximum = minimum + width;
          const random = createSeededRandom(seed);

          for (let index = 0; index < 50; index += 1) {
            const value = random.nextInt(minimum, maximum);
            expect(Number.isInteger(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(minimum);
            expect(value).toBeLessThanOrEqual(maximum);
          }
        },
      ),
    );
  });

  it('rejects invalid nextInt bounds', () => {
    const random = createSeededRandom('invalid-range');

    expect(() => random.nextInt(3, 2)).toThrow('minimum must be less than or equal to maximum');
    expect(() => random.nextInt(0.5, 2)).toThrow('bounds must be integers');
  });
});
```

- [ ] **Step 2: Run the RNG test and verify red**

Run:

```powershell
pnpm.cmd vitest run packages/simulation-core/src/rng/seeded-random.test.ts
```

Expected: FAIL because `seeded-random.ts` does not exist.

- [ ] **Step 3: Implement the minimal deterministic RNG**

Create `packages/simulation-core/src/rng/seeded-random.ts`:

```typescript
import type { RandomSource } from './random-source';

const UINT32_RANGE = 4_294_967_296;
const NON_ZERO_FALLBACK = 0x9e3779b9;

function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  const unsigned = hash >>> 0;
  return unsigned === 0 ? NON_ZERO_FALLBACK : unsigned;
}

export class SeededRandom implements RandomSource {
  private state: number;

  constructor(seed: string) {
    this.state = hashSeed(seed);
  }

  next(): number {
    let value = this.state;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.state = value >>> 0;

    return this.state / UINT32_RANGE;
  }

  nextInt(minimum: number, maximum: number): number {
    if (!Number.isInteger(minimum) || !Number.isInteger(maximum)) {
      throw new TypeError('bounds must be integers');
    }

    if (minimum > maximum) {
      throw new RangeError('minimum must be less than or equal to maximum');
    }

    return Math.floor(this.next() * (maximum - minimum + 1)) + minimum;
  }
}

export function createSeededRandom(seed: string): RandomSource {
  return new SeededRandom(seed);
}
```

Modify `packages/simulation-core/src/index.ts`:

```typescript
export type { RandomSource } from './rng/random-source';
export { createSeededRandom, SeededRandom } from './rng/seeded-random';
```

- [ ] **Step 4: Run the RNG tests and inspect for forbidden randomness**

Run:

```powershell
pnpm.cmd vitest run packages/simulation-core/src/rng/seeded-random.test.ts
rg -n "Math\\.random" apps packages
```

Expected: five tests pass and `rg` returns no matches.

- [ ] **Step 5: Checkpoint the deterministic RNG**

Run:

```powershell
git add packages/simulation-core
git commit -m "feat: add deterministic seeded random source"
```

---

## Task 5: Define stable battle-state contracts

**Files:**

- Create: `packages/shared-types/src/primitives/vec2.ts`
- Create: `packages/shared-types/src/battle/battle-state.ts`
- Create: `packages/shared-types/src/events/battle-event.ts`
- Create: `packages/shared-types/src/grid/grid-state.ts`
- Create: `packages/shared-types/src/grid/terrain-type.ts`
- Create: `packages/shared-types/src/monsters/monster-group-state.ts`
- Create: `packages/shared-types/src/units/formation-type.ts`
- Create: `packages/shared-types/src/units/morale-state.ts`
- Create: `packages/shared-types/src/units/unit-state.ts`
- Create: `packages/shared-types/src/battle/battle-state.test.ts`
- Modify: `packages/shared-types/src/index.ts`

**Interfaces:**

- Consumes: plain serializable values.
- Produces: stable contracts `Vec2`, `BattleState`, `BattleEvent`, `GridState`, `MonsterGroupState`, and `UnitState`.

- [ ] **Step 1: Write a failing contract-usage test**

Create `packages/shared-types/src/battle/battle-state.test.ts`:

```typescript
import { describe, expect, expectTypeOf, it } from 'vitest';

import type { BattleState, MonsterGroupState, UnitState } from '../index';

describe('BattleState contract', () => {
  it('contains deterministic replay inputs and battle-owned collections', () => {
    const state: BattleState = {
      schemaVersion: '1',
      gameVersion: '0.1.0',
      rulesVersion: '1',
      seed: 'greyfang',
      tick: 0,
      grid: {
        width: 128,
        height: 128,
        cells: [],
      },
      units: [],
      monsterGroups: [],
      events: [],
    };

    expect(state.seed).toBe('greyfang');
    expect(state.tick).toBe(0);
    expectTypeOf(state.units).toEqualTypeOf<readonly UnitState[]>();
    expectTypeOf(state.monsterGroups).toEqualTypeOf<readonly MonsterGroupState[]>();
  });
});
```

- [ ] **Step 2: Run the contract test and verify red**

Run:

```powershell
pnpm.cmd vitest run packages/shared-types/src/battle/battle-state.test.ts
```

Expected: FAIL because exported contracts do not exist.

- [ ] **Step 3: Implement the focused contracts**

Create `packages/shared-types/src/primitives/vec2.ts`:

```typescript
export interface Vec2 {
  readonly x: number;
  readonly y: number;
}
```

Create `packages/shared-types/src/units/formation-type.ts`:

```typescript
export type FormationType = 'DENSE_BLOCK' | 'LINE' | 'COLUMN' | 'LOOSE' | 'SQUARE' | 'WEDGE';
```

Create `packages/shared-types/src/units/morale-state.ts`:

```typescript
export type MoraleState = 'STEADY' | 'SHAKEN' | 'WAVERING' | 'BREAKING' | 'ROUTING';
```

Create `packages/shared-types/src/units/unit-state.ts`:

```typescript
import type { Vec2 } from '../primitives/vec2';
import type { FormationType } from './formation-type';
import type { MoraleState } from './morale-state';

export type UnitType = 'HEAVY_INFANTRY' | 'ARCHER' | 'CAVALRY' | 'HERO_TEAM';

export type UnitExecutionState = 'IDLE' | 'MOVING' | 'ENGAGED' | 'RETREATING' | 'ROUTING';

export interface UnitState {
  readonly id: string;
  readonly definitionId: string;
  readonly factionId: string;
  readonly name: string;
  readonly unitType: UnitType;
  readonly classId: string;
  readonly level: number;
  readonly experience: number;
  readonly troopCount: number;
  readonly initialTroopCount: number;
  readonly woundedCount: number;
  readonly deadCount: number;
  readonly routedCount: number;
  readonly missingCount: number;
  readonly capturedCount: number;
  readonly position: Vec2;
  readonly direction: Vec2;
  readonly targetPosition?: Vec2;
  readonly morale: number;
  readonly moraleState: MoraleState;
  readonly fatigue: number;
  readonly cohesion: number;
  readonly discipline: number;
  readonly commandEfficiency: number;
  readonly attack: number;
  readonly defense: number;
  readonly mobility: number;
  readonly carryingCapacity: number;
  readonly formation: FormationType;
  readonly executionState: UnitExecutionState;
  readonly commanderId?: string;
  readonly equipmentLoadoutId: string;
  readonly skillIds: readonly string[];
  readonly passiveIds: readonly string[];
  readonly statusEffectIds: readonly string[];
}
```

Create `packages/shared-types/src/monsters/monster-group-state.ts`:

```typescript
import type { Vec2 } from '../primitives/vec2';

export type MonsterBehaviorState =
  'IDLE' | 'HUNTING' | 'ENCIRCLING' | 'ENGAGED' | 'RETREATING' | 'ROUTING';

export interface MonsterGroupState {
  readonly id: string;
  readonly definitionId: string;
  readonly factionId: string;
  readonly troopCount: number;
  readonly initialTroopCount: number;
  readonly woundedCount: number;
  readonly deadCount: number;
  readonly routedCount: number;
  readonly missingCount: number;
  readonly capturedCount: number;
  readonly position: Vec2;
  readonly direction: Vec2;
  readonly targetPosition?: Vec2;
  readonly morale: number;
  readonly fatigue: number;
  readonly cohesion: number;
  readonly behaviorState: MonsterBehaviorState;
  readonly currentTargetId?: string;
  readonly abilityIds: readonly string[];
  readonly statusEffectIds: readonly string[];
}
```

Create `packages/shared-types/src/grid/terrain-type.ts`:

```typescript
export type TerrainType = 'PLAIN' | 'FOREST' | 'ROAD' | 'STREAM' | 'MUD' | 'RUIN';
```

Create `packages/shared-types/src/grid/grid-state.ts`:

```typescript
import type { Vec2 } from '../primitives/vec2';
import type { TerrainType } from './terrain-type';

export interface GridCellState {
  readonly index: number;
  readonly position: Vec2;
  readonly terrain: TerrainType;
  readonly height: number;
  readonly movementCost: number;
  readonly activeUnitIds: readonly string[];
  readonly activeMonsterIds: readonly string[];
  readonly environmentalEffects: readonly string[];
  readonly isActiveContactCell: boolean;
}

export interface GridState {
  readonly width: number;
  readonly height: number;
  readonly cells: readonly GridCellState[];
}
```

Create `packages/shared-types/src/events/battle-event.ts`:

```typescript
import type { Vec2 } from '../primitives/vec2';

export type BattleEventType =
  | 'BATTLE_STARTED'
  | 'UNIT_MOVED'
  | 'CONTACT_STARTED'
  | 'CASUALTIES_APPLIED'
  | 'MORALE_CHANGED'
  | 'UNIT_ROUTED';

export interface BattleEvent {
  readonly id: string;
  readonly tick: number;
  readonly type: BattleEventType;
  readonly sourceIds: readonly string[];
  readonly targetIds: readonly string[];
  readonly position?: Vec2;
  readonly causes: readonly string[];
  readonly effects: Readonly<Record<string, number | string | boolean>>;
  readonly visibility: 'PUBLIC' | 'PLAYER' | 'HIDDEN';
}
```

Create `packages/shared-types/src/battle/battle-state.ts`:

```typescript
import type { BattleEvent } from '../events/battle-event';
import type { GridState } from '../grid/grid-state';
import type { MonsterGroupState } from '../monsters/monster-group-state';
import type { UnitState } from '../units/unit-state';

export interface BattleState {
  readonly schemaVersion: string;
  readonly gameVersion: string;
  readonly rulesVersion: string;
  readonly seed: string;
  readonly tick: number;
  readonly grid: GridState;
  readonly units: readonly UnitState[];
  readonly monsterGroups: readonly MonsterGroupState[];
  readonly events: readonly BattleEvent[];
}
```

Replace `packages/shared-types/src/index.ts`:

```typescript
export type { BattleState } from './battle/battle-state';
export type { BattleEvent, BattleEventType } from './events/battle-event';
export type { GridCellState, GridState } from './grid/grid-state';
export type { TerrainType } from './grid/terrain-type';
export type { MonsterBehaviorState, MonsterGroupState } from './monsters/monster-group-state';
export type { Vec2 } from './primitives/vec2';
export type { FormationType } from './units/formation-type';
export type { MoraleState } from './units/morale-state';
export type { UnitExecutionState, UnitState, UnitType } from './units/unit-state';
```

- [ ] **Step 4: Run contract tests and build declarations**

Run:

```powershell
pnpm.cmd vitest run packages/shared-types/src/battle/battle-state.test.ts
pnpm.cmd --filter @expedition/shared-types build
```

Expected: contract test passes and `dist/index.d.ts` is emitted.

- [ ] **Step 5: Checkpoint the stable contracts**

Run:

```powershell
git add packages/shared-types
git commit -m "feat: define battle state contracts"
```

---

## Task 6: Create and assert BattleState without framework coupling

**Files:**

- Modify: `packages/simulation-core/package.json`
- Modify: `packages/simulation-core/tsconfig.json`
- Create: `packages/simulation-core/src/state/battle-state-input.ts`
- Create: `packages/simulation-core/src/state/create-battle-state.test.ts`
- Create: `packages/simulation-core/src/state/create-battle-state.ts`
- Create: `packages/simulation-core/src/state/assert-battle-state.test.ts`
- Create: `packages/simulation-core/src/state/assert-battle-state.ts`
- Modify: `packages/simulation-core/src/index.ts`

**Interfaces:**

- Consumes: `CreateBattleStateInput`.
- Produces: `createBattleState(input): BattleState`, `findBattleStateViolations(state): BattleStateViolation[]`, and `assertBattleState(state): void`.

- [ ] **Step 1: Link simulation-core to the stable contract package**

Replace `packages/simulation-core/package.json` with:

```json
{
  "name": "@expedition/simulation-core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "files": ["dist"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -b",
    "typecheck": "tsc -b --pretty false"
  },
  "dependencies": {
    "@expedition/shared-types": "workspace:*"
  }
}
```

Replace `packages/simulation-core/tsconfig.json` with:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "tsBuildInfoFile": "dist/.tsbuildinfo"
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts"],
  "references": [{ "path": "../shared-types" }]
}
```

- [ ] **Step 2: Write failing factory tests**

Create `packages/simulation-core/src/state/battle-state-input.ts`:

```typescript
import type { GridState, MonsterGroupState, UnitState } from '@expedition/shared-types';

export interface CreateBattleStateInput {
  readonly schemaVersion: string;
  readonly gameVersion: string;
  readonly rulesVersion: string;
  readonly seed: string;
  readonly grid: GridState;
  readonly units?: readonly UnitState[];
  readonly monsterGroups?: readonly MonsterGroupState[];
}
```

Create `packages/simulation-core/src/state/create-battle-state.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import { createBattleState } from './create-battle-state';

describe('createBattleState', () => {
  it('starts a deterministic battle at tick zero with no events', () => {
    const state = createBattleState({
      schemaVersion: '1',
      gameVersion: '0.1.0',
      rulesVersion: '1',
      seed: 'greyfang',
      grid: { width: 128, height: 128, cells: [] },
    });

    expect(state.tick).toBe(0);
    expect(state.seed).toBe('greyfang');
    expect(state.units).toEqual([]);
    expect(state.monsterGroups).toEqual([]);
    expect(state.events).toEqual([]);
  });
});
```

- [ ] **Step 3: Run the factory test and verify red**

Run:

```powershell
pnpm.cmd vitest run packages/simulation-core/src/state/create-battle-state.test.ts
```

Expected: FAIL because `create-battle-state.ts` does not exist.

- [ ] **Step 4: Implement the minimal factory**

Create `packages/simulation-core/src/state/create-battle-state.ts`:

```typescript
import type { BattleState } from '@expedition/shared-types';

import type { CreateBattleStateInput } from './battle-state-input';

export function createBattleState(input: CreateBattleStateInput): BattleState {
  return {
    schemaVersion: input.schemaVersion,
    gameVersion: input.gameVersion,
    rulesVersion: input.rulesVersion,
    seed: input.seed,
    tick: 0,
    grid: input.grid,
    units: input.units === undefined ? [] : [...input.units],
    monsterGroups: input.monsterGroups === undefined ? [] : [...input.monsterGroups],
    events: [],
  };
}
```

- [ ] **Step 5: Write failing invariant tests**

Create `packages/simulation-core/src/state/assert-battle-state.test.ts`:

```typescript
import type { BattleState } from '@expedition/shared-types';
import { describe, expect, it } from 'vitest';

import { assertBattleState, findBattleStateViolations } from './assert-battle-state';

const validState: BattleState = {
  schemaVersion: '1',
  gameVersion: '0.1.0',
  rulesVersion: '1',
  seed: 'greyfang',
  tick: 0,
  grid: { width: 128, height: 128, cells: [] },
  units: [],
  monsterGroups: [],
  events: [],
};

describe('battle state invariants', () => {
  it('accepts a valid empty battle state', () => {
    expect(findBattleStateViolations(validState)).toEqual([]);
    expect(() => assertBattleState(validState)).not.toThrow();
  });

  it('reports invalid dimensions, tick, and duplicate actor ids', () => {
    const invalidState: BattleState = {
      ...validState,
      tick: -1,
      grid: { width: 0, height: 128, cells: [] },
      units: [
        {
          id: 'duplicate',
          definitionId: 'heavy',
          factionId: 'player',
          name: 'First Heavy',
          unitType: 'HEAVY_INFANTRY',
          classId: 'infantry',
          level: 1,
          experience: 0,
          troopCount: 100,
          initialTroopCount: 100,
          woundedCount: 0,
          deadCount: 0,
          routedCount: 0,
          missingCount: 0,
          capturedCount: 0,
          position: { x: 0, y: 0 },
          direction: { x: 1, y: 0 },
          morale: 1,
          moraleState: 'STEADY',
          fatigue: 0,
          cohesion: 1,
          discipline: 1,
          commandEfficiency: 1,
          attack: 10,
          defense: 10,
          mobility: 1,
          carryingCapacity: 10,
          formation: 'DENSE_BLOCK',
          executionState: 'IDLE',
          equipmentLoadoutId: 'starter',
          skillIds: [],
          passiveIds: [],
          statusEffectIds: [],
        },
      ],
      monsterGroups: [
        {
          id: 'duplicate',
          definitionId: 'greyfang-wolf',
          factionId: 'monsters',
          troopCount: 20,
          initialTroopCount: 20,
          woundedCount: 0,
          deadCount: 0,
          routedCount: 0,
          missingCount: 0,
          capturedCount: 0,
          position: { x: 1, y: 1 },
          direction: { x: -1, y: 0 },
          morale: 1,
          fatigue: 0,
          cohesion: 0.4,
          behaviorState: 'IDLE',
          abilityIds: [],
          statusEffectIds: [],
        },
      ],
    };

    expect(findBattleStateViolations(invalidState)).toEqual([
      { code: 'NEGATIVE_TICK', path: 'tick' },
      { code: 'INVALID_GRID_WIDTH', path: 'grid.width' },
      { code: 'DUPLICATE_ACTOR_ID', path: 'monsterGroups[0].id' },
    ]);
    expect(() => assertBattleState(invalidState)).toThrow('BattleState invariant violation');
  });
});
```

- [ ] **Step 6: Run invariant tests and verify red**

Run:

```powershell
pnpm.cmd vitest run packages/simulation-core/src/state/assert-battle-state.test.ts
```

Expected: FAIL because `assert-battle-state.ts` does not exist.

- [ ] **Step 7: Implement focused invariant reporting**

Create `packages/simulation-core/src/state/assert-battle-state.ts`:

```typescript
import type { BattleState } from '@expedition/shared-types';

export type BattleStateViolationCode =
  'NEGATIVE_TICK' | 'INVALID_GRID_WIDTH' | 'INVALID_GRID_HEIGHT' | 'DUPLICATE_ACTOR_ID';

export interface BattleStateViolation {
  readonly code: BattleStateViolationCode;
  readonly path: string;
}

export function findBattleStateViolations(state: BattleState): BattleStateViolation[] {
  const violations: BattleStateViolation[] = [];

  if (state.tick < 0) {
    violations.push({ code: 'NEGATIVE_TICK', path: 'tick' });
  }

  if (!Number.isInteger(state.grid.width) || state.grid.width <= 0) {
    violations.push({ code: 'INVALID_GRID_WIDTH', path: 'grid.width' });
  }

  if (!Number.isInteger(state.grid.height) || state.grid.height <= 0) {
    violations.push({ code: 'INVALID_GRID_HEIGHT', path: 'grid.height' });
  }

  const actorIds = new Set<string>();

  state.units.forEach((unit, index) => {
    if (actorIds.has(unit.id)) {
      violations.push({ code: 'DUPLICATE_ACTOR_ID', path: `units[${index}].id` });
    }
    actorIds.add(unit.id);
  });

  state.monsterGroups.forEach((monsterGroup, index) => {
    if (actorIds.has(monsterGroup.id)) {
      violations.push({
        code: 'DUPLICATE_ACTOR_ID',
        path: `monsterGroups[${index}].id`,
      });
    }
    actorIds.add(monsterGroup.id);
  });

  return violations;
}

export function assertBattleState(state: BattleState): void {
  const violations = findBattleStateViolations(state);

  if (violations.length > 0) {
    throw new Error(`BattleState invariant violation: ${JSON.stringify(violations)}`);
  }
}
```

Replace `packages/simulation-core/src/index.ts`:

```typescript
export type { RandomSource } from './rng/random-source';
export { createSeededRandom, SeededRandom } from './rng/seeded-random';
export { assertBattleState, findBattleStateViolations } from './state/assert-battle-state';
export type { BattleStateViolation, BattleStateViolationCode } from './state/assert-battle-state';
export type { CreateBattleStateInput } from './state/battle-state-input';
export { createBattleState } from './state/create-battle-state';
```

- [ ] **Step 8: Run state tests and typecheck**

Run:

```powershell
pnpm.cmd vitest run packages/simulation-core/src/state
pnpm.cmd typecheck
```

Expected: factory and invariant tests pass and project references build without cross-package type errors.

- [ ] **Step 9: Checkpoint BattleState**

Run:

```powershell
git add packages/simulation-core package.json pnpm-lock.yaml
git commit -m "feat: add pure battle state foundation"
```

---

## Task 7: Close Batch 01 with architecture and regression evidence

**Files:**

- Create: `docs/reviews/batch-01-validation.md`

**Interfaces:**

- Consumes: all Batch 01 source, tests, configs, and package contracts.
- Produces: machine-readable command success plus a concise human validation record.

- [ ] **Step 1: Format the workspace**

Run:

```powershell
pnpm.cmd format
```

Expected: source and documentation use the configured formatting.

- [ ] **Step 2: Run the complete Batch 01 gate**

Run each command independently and preserve the actual result:

```powershell
pnpm.cmd typecheck
pnpm.cmd lint
pnpm.cmd format:check
pnpm.cmd arch:check
pnpm.cmd deadcode
pnpm.cmd test
pnpm.cmd build
```

Expected: every command exits with code 0.

- [ ] **Step 3: Generate and inspect the dependency graph**

Run:

```powershell
pnpm.cmd arch:graph
```

Expected: DOT output contains only allowed package directions and no circular edges.

- [ ] **Step 4: Record exact validation evidence**

Create `docs/reviews/batch-01-validation.md` with this structure and replace command statuses only with observed facts:

```markdown
# Batch 01 Validation

## Completed

- TASK-001 Monorepo
- TASK-002 Seeded RNG
- TASK-003 BattleState

## Contracts

- RandomSource
- BattleState
- UnitState
- MonsterGroupState
- GridState
- BattleEvent

## Verification

- `pnpm typecheck`: passed
- `pnpm lint`: passed
- `pnpm format:check`: passed
- `pnpm arch:check`: passed
- `pnpm deadcode`: passed
- `pnpm test`: passed
- `pnpm build`: passed

## Determinism

- Same-seed 100-value regression test passed.
- fast-check range properties passed.
- No `Math.random` usage exists under `apps/` or `packages/`.

## Deferred by scope

- Battle movement, grid projection, contact, pressure, and casualties begin in Batch 02.
- PixiJS rendering and Greyfang wolves begin in Batch 03.
- Loot, inventory, crafting, and Hornplate Shield begin in Batch 04.

## Known Risks

- Performance is not measured until visual points exist in Batch 03.
- Grid cell-count consistency is enforced when grid projection is implemented in Batch 02.
```

- [ ] **Step 5: Commit the Batch 01 evidence**

Run:

```powershell
git add docs/reviews/batch-01-validation.md
git commit -m "test: verify batch one foundation"
```

Expected: clean worktree on `codex/project-expedition-mvp`.
