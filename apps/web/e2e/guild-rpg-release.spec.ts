import { expect, test, type Page } from '@playwright/test';

test.setTimeout(90_000);

const expectNoHorizontalCrop = async (page: Page) => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
};

const expectFullyInViewport = async (page: Page, selector: string) => {
  const box = await page.locator(selector).boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
};

const expectMinTouchTarget = async (page: Page, selector: string, minimum = 44) => {
  const boxes = await page.locator(selector).evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }),
  );
  expect(boxes.length).toBeGreaterThan(0);
  for (const box of boxes) {
    expect(Math.max(box.width, box.height)).toBeGreaterThanOrEqual(minimum);
  }
};

const expectNoPairwiseOverlap = async (page: Page, selector: string) => {
  const boxes = await page.locator(selector).evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        id: element.getAttribute('data-battle-unit'),
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      };
    }),
  );
  for (let left = 0; left < boxes.length; left += 1) {
    for (let right = left + 1; right < boxes.length; right += 1) {
      const a = boxes[left]!;
      const b = boxes[right]!;
      const horizontal = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const vertical = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      expect(
        horizontal <= 1 || vertical <= 1,
        `${a.id} overlaps ${b.id} by ${horizontal}x${vertical}px`,
      ).toBe(true);
    }
  }
};

const expectSingleScreen = async (page: Page) => {
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollHeight <= window.innerHeight + 1 &&
        document.body.scrollHeight <= window.innerHeight + 1,
    ),
  ).toBe(true);
};

const mainNav = (page: Page) => page.getByRole('navigation', { name: '主要遊戲介面' });

async function expectBattlefieldVisible(page: Page, viewportLabel = 'current viewport') {
  const battlefield = page.locator('[data-combat-battlefield="true"]');
  await expect(battlefield).toBeVisible();
  await expect(battlefield.locator('[data-hero-formation]')).toHaveCount(6);
  await expect(battlefield.locator('[data-enemy-formation]')).toHaveCount(3);
  await expect(battlefield.locator('[data-focus-actor]')).toHaveCount(1);
  await expect(battlefield.locator('[data-focus-target]')).toHaveCount(1);
  await expectNoPairwiseOverlap(page, '[data-battle-unit]');
  const box = await battlefield.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(360);
  const command = await page.locator('.gr-command-dock').boundingBox();
  expect(command).not.toBeNull();
  expect(box).not.toBeNull();
  const horizontalOverlap =
    Math.min(command!.x + command!.width, box!.x + box!.width) - Math.max(command!.x, box!.x);
  const verticalOverlap =
    Math.min(command!.y + command!.height, box!.y + box!.height) - Math.max(command!.y, box!.y);
  expect(
    horizontalOverlap <= 1 || verticalOverlap <= 1,
    `${viewportLabel}: battlefield and command dock overlap by ${horizontalOverlap}x${verticalOverlap}px`,
  ).toBe(true);
}

async function castVisibleSkill(page: Page, castOnBattlefieldTarget = false) {
  const battle = page.locator('.gr-battle');
  let castTargetId: string | null = null;
  let castTargetHpBefore: number | undefined;
  await expect(battle).toHaveAttribute('data-playback', 'false', { timeout: 12_000 });
  const actorId = await page
    .locator('[data-combat-battlefield]')
    .getAttribute('data-current-actor');
  const availableSkills = page.locator('button[data-battle-skill]:not([disabled])');
  const strongestSkillIndex = await availableSkills.evaluateAll(
    (buttons) =>
      buttons.reduce(
        (best, button, index) => {
          const total = Number(button.getAttribute('data-skill-total') ?? 0);
          return total > best.total ? { index, total } : best;
        },
        { index: 0, total: Number.NEGATIVE_INFINITY },
      ).index,
  );
  const skill = availableSkills.nth(strongestSkillIndex);
  await expect(skill).toBeVisible();
  await expect(skill).toHaveAttribute('data-skill-segments', /\d+/);
  await expect(skill).toHaveAttribute('data-skill-total', /\d+/);
  await expect(skill).toHaveAttribute('data-trigger-summary', /→|連招/);
  const execution = (await skill.getAttribute('data-execution')) === 'true';
  const finalExecution = (await skill.getAttribute('data-final-execution')) === 'true';
  expect(
    (await page.locator('button[data-battle-skill]').allTextContents()).join(''),
  ).not.toContain('×');
  await skill.click();
  await expect(battle).toHaveAttribute('data-playback', 'false');
  await expect(skill).toHaveAttribute('data-armed', 'true');
  await expect(page.locator('[data-skill-preview]')).toBeVisible();
  if (execution) {
    await expect(page.locator('[data-combat-battlefield]')).toHaveAttribute(
      'data-execution-window',
      'true',
    );
    if (finalExecution) {
      await expect(page.locator('[data-execution-preview]')).toContainText('處刑預演');
      await expect(page.locator('[data-execution-preview]')).toContainText('回收5次');
      await expect(page.locator('[data-execution-preview]')).toContainText(/處刑\d+/);
    } else {
      await expect(page.locator('[data-execution-preview]')).toContainText('餘震回收');
      await expect(page.locator('[data-execution-preview]')).toContainText(/回收[1-4]次/);
      await expect(page.locator('[data-execution-preview]')).toContainText('第六棒蓄勢');
      await expect(page.locator('[data-execution-preview]')).not.toContainText('處刑0');
    }
    await expect(page.locator('[data-execution-preview]')).toContainText(/OVERKILL \+\d+/);
    await expect(page.locator('[data-skill-preview] [data-combo-step]')).toHaveCount(0);
    await expect(page.locator('[data-skill-preview]')).not.toContainText('0段');
    await expect(page.locator('[data-skill-preview]')).not.toContainText('基本命中');
  } else {
    expect(await page.locator('[data-skill-preview] [data-combo-step]').count()).toBeGreaterThan(0);
    await expect(page.locator('[data-skill-preview] [data-causal-step]')).toHaveCount(0);
    await expect(page.locator('[data-skill-preview] .gr-preview-details')).not.toHaveAttribute(
      'open',
      '',
    );
    await expect(page.locator('[data-skill-preview] [data-preview-total]')).toHaveCount(1);
    await expect(page.locator('[data-skill-preview]')).toContainText('本次：');
    await expect(page.locator('[data-skill-preview]')).toContainText('段');
    await expect(page.locator('[data-skill-preview]')).toContainText('追擊');
    await expect(page.locator('[data-skill-preview]')).toContainText('總傷');
    await expect(page.locator('[data-skill-preview]')).toContainText('接棒：');
  }
  expect(await page.locator('[data-skill-preview]').innerText()).not.toContain('×');
  await expect(page.locator('[data-pixi-combat-stage="true"]')).toHaveAttribute(
    'data-preview-total',
    /\d+/,
  );
  if (castOnBattlefieldTarget) {
    const alternativeTarget = page
      .locator('[data-battle-side="enemies"]:not([disabled]):not([data-targeted="true"])')
      .last();
    castTargetId = await alternativeTarget.getAttribute('data-battle-unit');
    castTargetHpBefore = Number(
      (await alternativeTarget.getAttribute('aria-label'))?.match(/生命 (\d+) \//)?.[1],
    );
    await alternativeTarget.click();
  } else {
    await skill.click();
  }
  await expect(battle).toHaveAttribute('data-playback', 'true');
  const stage = page.locator('[data-pixi-combat-stage="true"]');
  if (execution) {
    await expect(stage).toHaveAttribute('data-effect-phase', 'finisher');
  } else {
    await expect(stage).toHaveAttribute('data-effect-element', /fire|grass|water/);
    await expect(stage).toHaveAttribute(
      'data-effect-specialization',
      /blast|stack|weaken|chain|empower|multistrike/,
    );
    await expect(stage).toHaveAttribute(
      'data-effect-phase',
      /windup|travel|impact|aftermath|finisher/,
    );
  }
  const relay = Number(
    await page.locator('[data-combat-battlefield]').getAttribute('data-relay-tier'),
  );
  await expect(battle).toHaveAttribute('data-playback', 'false', { timeout: 12_000 });
  if (castTargetId && castTargetHpBefore !== undefined) {
    const hpAfter = Number(
      (
        await page.locator(`[data-battle-unit="${castTargetId}"]`).getAttribute('aria-label')
      )?.match(/生命 (\d+) \//)?.[1],
    );
    expect(hpAfter).toBeLessThan(castTargetHpBefore);
  }
  if ((await page.locator('[data-combat-battlefield]').getAttribute('data-finisher')) !== 'true') {
    await expect(page.locator('[data-combat-battlefield]')).not.toHaveAttribute(
      'data-current-actor',
      actorId ?? '',
    );
  }
  return { actorId, relay, execution, finalExecution };
}

test('a new player understands combat, sees six escalating relays, and completes the loot loop', async ({
  page,
}) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem(
      'expedition:guild-rpg:preferences:v1',
      JSON.stringify({
        version: 1,
        tutorial: 'active',
        masterVolume: 0,
        musicEnabled: false,
        hapticsEnabled: false,
        motion: 'reduced',
      }),
    );
  });
  await page.goto('/');

  await expect(page.getByText('六人接力刷寶遠征', { exact: true })).toBeVisible();
  await expect(mainNav(page).getByRole('button')).toHaveCount(4);
  await expect(page.locator('[data-first-session="true"]')).toBeVisible();
  await expect(page.getByRole('button', { name: '開始第一場教學戰' })).toHaveCount(1);
  await expectFullyInViewport(page, '[data-guide-id="hunt:start"]');
  await expectNoHorizontalCrop(page);

  await page.getByRole('button', { name: '開始第一場教學戰' }).click();
  await expectBattlefieldVisible(page);
  await expectSingleScreen(page);
  await expect(page.locator('.gr-battle-guide-strip')).toBeVisible();
  await expect(page.locator('button[data-battle-skill]')).toHaveCount(6);
  const skillText = (await page.locator('button[data-battle-skill]').allTextContents()).join('');
  expect(skillText).not.toMatch(/威力|疊層|追燃|×/);
  expect(skillText).toContain('段');
  expect(skillText).toContain('總傷');
  expect(skillText).toContain('開戰');
  await expectMinTouchTarget(page, 'button[data-battle-skill]');
  await expectFullyInViewport(page, 'button[data-battle-skill="6"]');
  await expect(page.locator('[data-combat-battlefield]')).toHaveAttribute(
    'data-current-actor',
    'brann',
  );
  await expect(page.locator('[data-combat-battlefield]')).toHaveAttribute(
    'data-next-actor',
    'lyra',
  );
  await expect(page.locator('[data-combat-battlefield]')).toHaveAttribute(
    'data-battlefield-layout',
    'portrait',
  );
  await page.getByRole('button', { name: /灰牙斥候/ }).click();
  await expect(page.locator('[data-battle-side="enemies"][data-targeted="true"]')).toHaveCount(1);

  const firstRelays: {
    actorId: string | null;
    relay: number;
    execution: boolean;
    finalExecution: boolean;
  }[] = [];
  for (let turn = 0; turn < 60; turn += 1) {
    const collect = page.getByRole('button', { name: '收下全部戰利品' });
    if (await collect.isVisible().catch(() => false)) break;
    const result = await castVisibleSkill(page);
    if (firstRelays.length < 6) firstRelays.push(result);
  }

  expect(firstRelays.map(({ actorId }) => actorId)).toEqual([
    'brann',
    'lyra',
    'elin',
    'seph',
    'lorne',
    'kyro',
  ]);
  expect(firstRelays.map(({ relay }) => relay)).toEqual([1, 2, 3, 4, 5, 6]);
  const firstExecution = firstRelays.findIndex(({ execution }) => execution);
  expect(firstExecution).toBeGreaterThanOrEqual(0);
  expect(firstRelays.slice(firstExecution).every(({ execution }) => execution)).toBe(true);
  expect(firstRelays.some(({ execution, finalExecution }) => execution && !finalExecution)).toBe(
    true,
  );
  expect(firstRelays.at(-1)?.finalExecution).toBe(true);
  await expect(page.locator('body')).not.toContainText('battle_open');
  await expect(page.locator('body')).not.toContainText('已播放');
  await expect(page.getByRole('button', { name: '收下全部戰利品' })).toBeEnabled();
  await page.getByRole('button', { name: '收下全部戰利品' }).click();

  await expect(page.locator('.gr-rewards')).toBeVisible();
  await expect(page.getByText('戰利品入袋', { exact: true })).toBeVisible();
  await expect(page.locator('[data-loot-item]')).toHaveCount(6);
  await expect(page.locator('[data-loot-item][data-rarity="skill"]')).toHaveCount(2);
  await expect(page.locator('[data-loot-item]:not([data-rarity="skill"])')).toHaveCount(4);
  await expect(page.locator('[data-pager="loot"]')).toHaveCount(0);
  await expect(page.locator('.gr-loot-detail-drawer')).toHaveCount(0);
  await expectSingleScreen(page);
  await expectMinTouchTarget(page, '[data-loot-item]');
  await page.locator('[data-loot-item]').first().click();
  await expect(page.locator('.gr-loot-detail-drawer')).toHaveCount(1);
  await page.locator('.gr-loot-detail-drawer .gr-drawer-action').click();
  await expect(page.locator('.gr-status-line')).toContainText('已裝備');
  await page.getByRole('button', { name: '整理裝備' }).click();

  await page.locator('.gr-help-drawer > summary').click();
  await expect(page.getByRole('region', { name: '公會訓練清單' })).toBeVisible();
  await page.locator('.gr-help-drawer > summary').click();
  await page.getByRole('button', { name: '校準' }).first().click();
  await page.locator('[data-guide-id="nav:skills"]').click();

  await page.locator('[data-workspace-tab="fusion"]').click();
  await expect(page.getByRole('heading', { name: '技能融合工坊' })).toBeVisible();
  const candidates = page.locator('.gr-fusion__candidates button');
  await expect(candidates).toHaveCount(2);
  await candidates.nth(0).click();
  await candidates.nth(1).click();
  await page.getByRole('button', { name: /融合已選 2 張技能/ }).click();
  await expect(page.getByText(/融合完成/)).toBeVisible();
  await page.locator('[data-workspace-tab="loadout"]').click();
  const fusedCard = page.locator('.gr-skill-card').filter({ hasText: '2★' }).first();
  await fusedCard.getByRole('button', { name: /裝備到第/ }).click();
  await expect(page.getByText(/下一位：/)).toBeVisible();

  await page.locator('[data-guide-id="nav:quest"]').click();
  await page.getByRole('button', { name: '再次狩獵' }).click();
  await expect(page.locator('.gr-battle')).toBeVisible();
  await expect(page.locator('.gr-battle-guide-strip')).toHaveCount(0);
  await expectBattlefieldVisible(page);
  await expectSingleScreen(page);
  await expectNoHorizontalCrop(page);
  expect(pageErrors).toEqual([]);
});

test('migrates a v3 save, preserves its backup, and keeps every main page usable at 375px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem(
      'expedition:guild-rpg:v3',
      JSON.stringify({
        version: 3,
        leaderId: 'lyra',
        party: ['brann', 'lyra', 'elin'].map((definitionId) => ({
          definitionId,
          level: 3,
          experience: 25,
          equipment: {},
        })),
        inventory: [],
        materials: { hunter_sinew: 4 },
        gold: 456,
        unlockedQuestIds: ['border_pack', 'moonroad_pursuit'],
        questRecords: { border_pack: { clears: 2 } },
        nextLootSeed: 7,
        selectedBuildId: 'retaliation',
        loadouts: { retaliation: ['brann_guard', 'lyra_mark'] },
        completedChallengeIds: [],
        discoveredEquipmentIds: [],
        discoveredRuleIds: [],
        forgeSequence: 0,
        progressionEvents: [],
      }),
    );
  });
  await page.goto('/');

  await expect(page.locator('.gr-status-line')).toContainText('公會紀錄已載入。');
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('expedition:guild-rpg:v4')!).version),
  ).toBe(4);
  expect(
    await page.evaluate(() => localStorage.getItem('expedition:guild-rpg:v3:backup')),
  ).not.toBeNull();

  for (const pageId of ['quest', 'party', 'skills', 'equipment']) {
    await page.locator(`[data-guide-id="nav:${pageId}"]`).click();
    await expectNoHorizontalCrop(page);
    await expectSingleScreen(page);
    await expectFullyInViewport(page, '.gr-main-nav');
  }
  await expect(page.getByRole('button', { name: '布蘭' })).toBeVisible();
  await expectMinTouchTarget(page, '.gr-main-nav button');
});

test('keeps the semantic WebGL battle readable at wide mobile and desktop sizes', async ({
  page,
}) => {
  for (const viewport of [
    { width: 430, height: 932 },
    { width: 1_280, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem(
        'expedition:guild-rpg:preferences:v1',
        JSON.stringify({
          version: 1,
          tutorial: 'skipped',
          masterVolume: 0,
          musicEnabled: false,
          hapticsEnabled: false,
          motion: 'reduced',
        }),
      );
    });
    await page.goto('/');
    await page.locator('[data-hunt-card="border_pack"] .gr-primary-action').click();

    await expectBattlefieldVisible(page, `${viewport.width}x${viewport.height}`);
    await expectSingleScreen(page);
    await expect(page.locator('[data-pixi-combat-stage="true"] canvas')).toHaveCount(1);
    await expect(page.locator('button[data-battle-skill]')).toHaveCount(6);
    await expect(page.locator('[data-combat-battlefield]')).toHaveAttribute(
      'data-battlefield-layout',
      viewport.width <= 620 ? 'portrait' : 'landscape',
    );
    await expectNoHorizontalCrop(page);
    await castVisibleSkill(page);
  }
});

test('exposes campaign mastery and starts the selected ascension without mobile overflow', async ({
  page,
}) => {
  const questIds = [
    'border_pack',
    'moonroad_pursuit',
    'red_fang_den',
    'abandoned_mine',
    'blast_gallery',
    'iron_throne',
    'dragon_shrine',
    'ashen_aisle',
    'solar_nest',
    'storm_gate',
    'chain_vault',
    'skybreaker_crown',
  ];
  await page.setViewportSize({ width: 375, height: 667 });
  await page.addInitScript((completedQuestIds) => {
    if (sessionStorage.getItem('ascension-e2e-seeded') === 'true') return;
    sessionStorage.setItem('ascension-e2e-seeded', 'true');
    localStorage.clear();
    localStorage.setItem(
      'expedition:guild-rpg:preferences:v1',
      JSON.stringify({
        version: 1,
        tutorial: 'skipped',
        masterVolume: 0,
        musicEnabled: false,
        hapticsEnabled: false,
        motion: 'reduced',
      }),
    );
    localStorage.setItem(
      'expedition:guild-rpg:v3',
      JSON.stringify({
        version: 3,
        leaderId: 'brann',
        party: ['brann', 'lyra', 'elin'].map((definitionId) => ({
          definitionId,
          level: 3,
          experience: 25,
          equipment: {},
        })),
        inventory: [],
        materials: {},
        gold: 999,
        unlockedQuestIds: completedQuestIds,
        questRecords: Object.fromEntries(
          completedQuestIds.map((questId) => [
            questId,
            {
              clears: 1,
              bestOverkill: questId === 'border_pack' ? 324 : 0,
              bestChain: questId === 'border_pack' ? 6 : 0,
            },
          ]),
        ),
        nextLootSeed: 12,
        selectedBuildId: 'retaliation',
        loadouts: { retaliation: ['brann_guard', 'lyra_mark'] },
        completedChallengeIds: [],
        discoveredEquipmentIds: [],
        discoveredRuleIds: [],
        forgeSequence: 0,
        progressionEvents: [],
      }),
    );
  }, questIds);
  await page.goto('/');
  await page.waitForFunction(() => {
    const profile = JSON.parse(localStorage.getItem('expedition:guild-rpg:v4') ?? 'null');
    return profile?.version === 4;
  });
  await page.waitForTimeout(50);
  await page.evaluate(() => {
    const key = 'expedition:guild-rpg:v4';
    const profile = JSON.parse(localStorage.getItem(key)!);
    profile.questRecords.border_pack = {
      ...profile.questRecords.border_pack,
      bestOverkill: 324,
      bestChain: 6,
    };
    localStorage.setItem(key, JSON.stringify(profile));
  });
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('expedition:guild-rpg:v4')!).questRecords.border_pack
          .bestOverkill,
    ),
  ).toBe(324);
  await page.reload();

  await expect(page.locator('[data-hunt-mastery="border_pack"]')).toContainText('挑戰 0/4');
  await expect(page.locator('[data-hunt-mastery="border_pack"]')).toContainText('OVERKILL 324');
  await expect(page.locator('[data-hunt-mastery="border_pack"]')).toContainText('最長連鎖 6');
  await expect(page.locator('[data-ascension-mode]')).toHaveCount(4);
  await page.locator('[data-ascension-mode="annihilation_weather"]').click();
  await expect(page.getByRole('button', { name: '挑戰 殲滅天候' })).toBeVisible();
  await expectSingleScreen(page);
  await expectNoHorizontalCrop(page);

  await page.getByRole('button', { name: '挑戰 殲滅天候' }).click();
  await expect(page.locator('.gr-battle__header')).toContainText('ASCENSION · 殲滅天候');
  await expectBattlefieldVisible(page);
  await expectSingleScreen(page);
  await expectNoHorizontalCrop(page);
});
