import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { preview as startVitePreview } from 'vite';

import { assertPortAvailable } from './run-e2e.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildRoot = path.join(
  repositoryRoot,
  'apps/game-client-cocos/build/web-mobile/expedition-mobile',
);
const host = '127.0.0.1';
const defaultPort = 4178;

const closePreview = async (server) => {
  server.httpServer.closeAllConnections?.();
  await new Promise((resolve, reject) => {
    server.httpServer.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
};

export async function withCocosPreview(options, task) {
  const port = options.port ?? defaultPort;
  const ensurePortAvailable = options.ensurePortAvailable ?? assertPortAvailable;
  const previewFactory = options.previewFactory ?? startVitePreview;
  await ensurePortAvailable(host, port);
  const server = await previewFactory({
    root: path.dirname(buildRoot),
    configFile: false,
    logLevel: 'warn',
    build: { outDir: path.basename(buildRoot) },
    preview: { host, port, strictPort: true },
  });
  try {
    return await task(`http://${host}:${port}`);
  } finally {
    await closePreview(server);
  }
}

const runBrowserChecks = async (url) => {
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    const viewports = [
      { width: 375, height: 812 },
      { width: 390, height: 844 },
      { width: 1280, height: 720 },
      { width: 1920, height: 1080 },
    ];
    for (const viewport of viewports) {
      const mobile = viewport.width < viewport.height;
      const context = await browser.newContext({
        viewport,
        hasTouch: mobile,
        isMobile: mobile,
      });
      const page = await context.newPage();
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.locator('#GameCanvas').waitFor({ state: 'visible' });
      const dimensions = await page.evaluate(() => {
        const root = globalThis.document.documentElement;
        return {
          clientWidth: root.clientWidth,
          clientHeight: root.clientHeight,
          scrollWidth: root.scrollWidth,
          scrollHeight: root.scrollHeight,
        };
      });
      if (
        dimensions.clientWidth !== dimensions.scrollWidth ||
        dimensions.clientHeight !== dimensions.scrollHeight
      ) {
        throw new Error(`${viewport.width}x${viewport.height} introduced page scrolling`);
      }
      const diagnostics = await waitForDiagnostics(page);
      if (diagnostics.mode !== (mobile ? 'mobile-portrait' : 'desktop-landscape')) {
        throw new Error(`${viewport.width}x${viewport.height} used ${diagnostics.mode}`);
      }
      if (diagnostics.skillColumns !== (mobile ? 3 : 6)) {
        throw new Error(`${viewport.width}x${viewport.height} used wrong skill columns`);
      }
      assertUnitLayout(diagnostics, `${viewport.width}x${viewport.height}`);
      await context.close();
    }

    const viewport = { width: 390, height: 844 };
    const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto(url, { waitUntil: 'networkidle' });
    await playCompleteHunt(page, viewport);
    await context.close();
    if (errors.length > 0) throw new Error(`Browser console errors: ${errors.join(' | ')}`);
  } finally {
    await browser.close();
  }
};

const waitForDiagnostics = (page) =>
  page
    .waitForFunction(
      () => {
        const state = globalThis.__EXPEDITION_DIAGNOSTICS__;
        return state && Array.isArray(state.units) && Array.isArray(state.skills)
          ? state
          : undefined;
      },
      undefined,
      { timeout: 15_000 },
    )
    .then((handle) => handle.jsonValue());

const assertUnitLayout = (diagnostics, label) => {
  const units = diagnostics.units;
  if (units.filter(({ side }) => side === 'heroes').length !== 6) {
    throw new Error(`${label} did not render six heroes`);
  }
  if (units.filter(({ side }) => side === 'enemies').length !== 3) {
    throw new Error(`${label} did not render three enemies`);
  }
  for (let index = 0; index < units.length; index += 1) {
    const unit = units[index];
    if (
      Math.abs(unit.x) + unit.width / 2 > diagnostics.battlefield.width / 2 + 0.5 ||
      Math.abs(unit.y) + unit.height / 2 > diagnostics.battlefield.height / 2 + 0.5
    ) {
      throw new Error(`${label} unit ${unit.id} overflowed the battlefield`);
    }
    for (let other = index + 1; other < units.length; other += 1) {
      const candidate = units[other];
      const separated =
        Math.abs(unit.x - candidate.x) >= (unit.width + candidate.width) / 2 ||
        Math.abs(unit.y - candidate.y) >= (unit.height + candidate.height) / 2;
      if (!separated) throw new Error(`${label} units ${unit.id}/${candidate.id} overlapped`);
    }
  }
};

const tapPoint = async (page, viewport, point) => {
  await page.touchscreen.tap(point.screenX * viewport.width, point.screenY * viewport.height);
};

const playCompleteHunt = async (page, viewport) => {
  for (let action = 0; action < 24; action += 1) {
    const before = await waitForDiagnostics(page);
    if (before.status === 'victory') break;
    const bestSkill = before.skills.slice().sort((left, right) => right.damage - left.damage)[0];
    const target = before.units.find(({ id }) => id === before.targetId);
    if (!bestSkill || !target) throw new Error(`Action ${action + 1} has no skill or target`);
    await tapPoint(page, viewport, bestSkill);
    await page.waitForFunction(
      (skillId) =>
        globalThis.__EXPEDITION_DIAGNOSTICS__?.skills?.some(
          (skill) => skill.id === skillId && skill.selected,
        ),
      bestSkill.id,
    );
    const eventCount = before.eventCount ?? 0;
    await tapPoint(page, viewport, target);
    await page.waitForFunction(
      (previousCount) => {
        const state = globalThis.__EXPEDITION_DIAGNOSTICS__;
        return state?.status === 'victory' || (state?.eventCount ?? 0) > previousCount;
      },
      eventCount,
      { timeout: 25_000 },
    );
  }
  const victory = await waitForDiagnostics(page);
  if (victory.status !== 'victory' || !victory.rewardVisible) {
    throw new Error('Complete mobile hunt did not reach the reward scene');
  }
  if (victory.rewardCapacity !== 20 || victory.rewardSkillCount !== 1 || victory.rewardCount < 1) {
    throw new Error('Reward scene did not expose the 20-slot, one-skill contract');
  }
  await tapPoint(page, viewport, victory.rewardFirstPoint);
  await page.waitForFunction(() => Boolean(globalThis.__EXPEDITION_DIAGNOSTICS__?.selectedLootId));
  await tapPoint(page, viewport, victory.collectPoint);
  await page.waitForFunction(
    () => globalThis.__EXPEDITION_DIAGNOSTICS__?.rewardsCollected === true,
  );
};

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  await withCocosPreview({}, runBrowserChecks);
  process.stdout.write('Cocos E2E passed; preview server closed.\n');
}
