import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { preview as startVitePreview } from 'vite';
import {
  getGuildProfileValidationIssues,
  parseGuildSave,
} from '../apps/game-client-cocos/assets/runtime/expedition-runtime.mjs';

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
      const guild = await waitForScreen(page, 'guild');
      await tapPoint(page, viewport, guild.startQuestPoint);
      const diagnostics = await waitForScreen(page, 'battle');
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
    await playCompleteGuildLoop(page, viewport);
    await context.close();
    if (errors.length > 0) throw new Error(`Browser console errors: ${errors.join(' | ')}`);
  } finally {
    await browser.close();
  }
};

const waitForState = async (page, predicate, timeout = 15_000) => {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => globalThis.__EXPEDITION_DIAGNOSTICS__);
    if (state && predicate(state)) return state;
    await page.waitForTimeout(50);
  }
  throw new Error(`Timed out waiting for Cocos diagnostics after ${timeout}ms`);
};

const waitForScreen = (page, screen) => waitForState(page, (state) => state.screen === screen);

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
  if (!point) throw new Error('Missing diagnostic interaction point');
  await page.mouse.click(point.screenX * viewport.width, point.screenY * viewport.height);
};

const playBattleToVictory = async (page, viewport) => {
  for (let action = 0; action < 48; action += 1) {
    let before = await waitForScreen(page, 'battle');
    if (before.status === 'victory') break;
    const aliveTarget =
      before.units.find(
        ({ id, side, hp }) => id === before.targetId && side === 'enemies' && hp > 0,
      ) ?? before.units.find(({ side, hp }) => side === 'enemies' && hp > 0);
    const executionTarget =
      aliveTarget ??
      before.units.find(({ id, side }) => id === before.targetId && side === 'enemies') ??
      before.units.find(({ side }) => side === 'enemies');
    if (!executionTarget) throw new Error(`Action ${action + 1} has no enemy target`);
    if (executionTarget.id !== before.targetId) {
      await tapPoint(page, viewport, executionTarget);
      before = await waitForState(
        page,
        (state) => state.screen === 'battle' && state.targetId === executionTarget.id,
      );
    }
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
  const victory = await waitForState(
    page,
    (state) =>
      state.screen === 'battle' &&
      state.status === 'victory' &&
      state.victoryConfirmVisible === true,
    35_000,
  );
  if (!victory.collectPoint) {
    throw new Error('Complete hunt did not expose the victory confirmation');
  }
  return victory;
};

const playCompleteGuildLoop = async (page, viewport) => {
  const guild = await waitForScreen(page, 'guild');
  if (guild.page !== 'quest' || guild.partyCount !== 6 || guild.destinationCount !== 4) {
    throw new Error('New profile did not boot into the complete six-member guild shell');
  }
  await tapPoint(page, viewport, guild.startQuestPoint);
  await waitForScreen(page, 'battle');
  const victory = await playBattleToVictory(page, viewport);
  await tapPoint(page, viewport, victory.collectPoint);

  const rewards = await waitForScreen(page, 'rewards');
  if (rewards.rewardCapacity !== 20 || rewards.rewardSkillCount !== 1 || rewards.rewardCount < 1) {
    throw new Error('Reward scene did not expose the 20-slot, one-skill contract');
  }
  await tapPoint(page, viewport, rewards.firstEntryPoint);
  const detail = await waitForState(
    page,
    (state) => state.screen === 'rewards' && Boolean(state.selectedLootId),
  );
  await tapPoint(page, viewport, detail.rewardEquipPoint);
  const equippedReward = await waitForState(
    page,
    (state) => state.screen === 'rewards' && state.tutorialStep === 'forge_loot',
  );
  await tapPoint(page, viewport, equippedReward.routePoints.equipment);

  let equipment = await waitForState(
    page,
    (state) => state.screen === 'guild' && state.page === 'equipment',
  );
  let forge;
  for (const point of equipment.equipmentSlotPoints) {
    await tapPoint(page, viewport, point);
    try {
      forge = await waitForState(page, (state) => state.forgeVisible === true, 700);
      break;
    } catch {
      // Empty slots are intentionally inert; try the next equipped slot.
    }
  }
  if (!forge) throw new Error('Equipped reward could not be opened in the forge');
  await tapPoint(page, viewport, forge.calibratePoint);
  equipment = await waitForState(
    page,
    (state) =>
      state.screen === 'guild' &&
      state.page === 'equipment' &&
      state.tutorialStep === 'inspect_skills',
  );
  await tapPoint(page, viewport, equipment.navPoints.skills);

  let skills = await waitForState(
    page,
    (state) =>
      state.screen === 'guild' && state.page === 'skills' && state.tutorialStep === 'equip_skill',
  );
  await tapPoint(page, viewport, skills.equipSkillPoint);
  skills = await waitForState(
    page,
    (state) =>
      state.screen === 'guild' && state.page === 'skills' && state.tutorialStep === 'replay',
  );
  await tapPoint(page, viewport, skills.skillWorkspacePoints.fusion);
  skills = await waitForState(
    page,
    (state) => state.screen === 'guild' && state.skillWorkspace === 'fusion',
  );
  await tapPoint(page, viewport, skills.skillWorkspacePoints.loadout);
  skills = await waitForState(
    page,
    (state) => state.screen === 'guild' && state.skillWorkspace === 'loadout',
  );

  await tapPoint(page, viewport, skills.navPoints.party);
  let party = await waitForState(
    page,
    (state) => state.screen === 'guild' && state.page === 'party',
  );
  const originalFirst = party.defaultOrder[0];
  const secondHero = party.defaultOrder[1];
  await tapPoint(page, viewport, party.partyHeroPoints[1]);
  party = await waitForState(
    page,
    (state) =>
      state.screen === 'guild' && state.page === 'party' && state.selectedHeroId === secondHero,
  );
  await tapPoint(page, viewport, party.moveEarlierPoint);
  party = await waitForState(
    page,
    (state) =>
      state.screen === 'guild' && state.page === 'party' && state.defaultOrder[0] !== originalFirst,
  );
  const persistedAfterReorder = await page.evaluate(() => {
    const value = globalThis.localStorage.getItem('expedition:guild-rpg:v5');
    return value ? JSON.parse(value).defaultOrder : undefined;
  });
  if (persistedAfterReorder?.[0] === originalFirst) {
    throw new Error('Controller changed party order without persisting it');
  }
  await tapPoint(page, viewport, party.navPoints.quest);
  const replay = await waitForState(
    page,
    (state) => state.screen === 'guild' && state.page === 'quest',
  );
  await tapPoint(page, viewport, replay.startQuestPoint);
  await waitForScreen(page, 'battle');
  const serializedBeforeReload = await page.evaluate(() =>
    globalThis.localStorage.getItem('expedition:guild-rpg:v5'),
  );
  const persistedBeforeReload = serializedBeforeReload
    ? JSON.parse(serializedBeforeReload).defaultOrder
    : undefined;
  if (!parseGuildSave(serializedBeforeReload)) {
    const saved = serializedBeforeReload ? JSON.parse(serializedBeforeReload) : undefined;
    throw new Error(
      `Browser persisted a profile that the v5 loader rejects: ${getGuildProfileValidationIssues(saved).join(',')}; values=${JSON.stringify(
        {
          completedChallengeIds: saved?.completedChallengeIds,
          discoveredEquipmentIds: saved?.discoveredEquipmentIds,
          discoveredCoreIds: saved?.discoveredCoreIds,
        },
      )}`,
    );
  }

  await page.reload({ waitUntil: 'networkidle' });
  const restored = await waitForState(
    page,
    (state) =>
      state.screen === 'guild' &&
      state.page === 'quest' &&
      state.tutorialStep === 'complete' &&
      state.partyCount === 6,
  );
  if (restored.defaultOrder[0] === originalFirst) {
    throw new Error(
      `Reload lost the reordered six-member party; stored=${persistedBeforeReload?.join(',')}`,
    );
  }
  await page.evaluate(() => {
    globalThis.localStorage.setItem(
      'expedition:guild-rpg:session:v1',
      '{"version":1,"tutorialStep":"corrupt"}',
    );
  });
  await page.reload({ waitUntil: 'networkidle' });
  const recovered = await waitForScreen(page, 'guild');
  if (recovered.partyCount !== 6) throw new Error('Corrupt session recovery lost the v5 profile');
};

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  await withCocosPreview({}, runBrowserChecks);
  process.stdout.write('Cocos E2E passed; preview server closed.\n');
}
