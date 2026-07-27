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

const mainNav = (page: Page) => page.getByRole('navigation', { name: '主要遊戲介面' });

async function expectBattlefieldVisible(page: Page) {
  const battlefield = page.locator('[data-combat-battlefield="true"]');
  await expect(battlefield).toBeVisible();
  await expect(battlefield.locator('[data-hero-formation]')).toHaveCount(6);
  await expect(battlefield.locator('[data-enemy-formation]')).toHaveCount(3);
  const box = await battlefield.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(360);
  const command = await page.locator('.gr-command-dock').boundingBox();
  expect(command && box ? command.y >= box.y + box.height - 1 : false).toBe(true);
}

async function castVisibleSkill(page: Page) {
  const battle = page.locator('.gr-battle');
  await expect(battle).toHaveAttribute('data-playback', 'false', { timeout: 12_000 });
  const actorId = await page
    .locator('[data-combat-battlefield]')
    .getAttribute('data-current-actor');
  const skill = page.locator('button[data-battle-skill]:not([disabled])').first();
  await expect(skill).toBeVisible();
  await skill.click();
  await expect(battle).toHaveAttribute('data-playback', 'true');
  await expect(page.locator('button[data-battle-skill]:not([disabled])')).toHaveCount(0);
  const relay = Number(
    await page.locator('[data-combat-battlefield]').getAttribute('data-relay-tier'),
  );
  await expect(battle).toHaveAttribute('data-playback', 'false', { timeout: 12_000 });
  return { actorId, relay };
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
  await expect(page.getByRole('heading', { name: '目前出手：布蘭' })).toBeVisible();
  await expectBattlefieldVisible(page);
  await expect(page.locator('button[data-battle-skill]')).toHaveCount(6);
  await expectFullyInViewport(page, 'button[data-battle-skill="6"]');
  await expect(page.locator('[data-combat-battlefield]')).toHaveAttribute(
    'data-current-actor',
    'brann',
  );
  await expect(page.locator('[data-combat-battlefield]')).toHaveAttribute(
    'data-next-actor',
    'lyra',
  );
  await page.getByRole('button', { name: /灰牙斥候/ }).click();
  await expect(page.getByText('第 1 棒：布蘭', { exact: false })).toBeVisible();

  const firstRelays: { actorId: string | null; relay: number }[] = [];
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
  await expect(page.getByRole('button', { name: '收下全部戰利品' })).toBeEnabled();
  await page.getByRole('button', { name: '收下全部戰利品' }).click();

  await expect(page.locator('.gr-rewards')).toBeVisible();
  await expect(page.getByText('接力殲滅完成', { exact: true })).toBeVisible();
  await expect(page.locator('[data-loot-reveal]')).toHaveCount(6);
  await expect(page.locator('[data-loot-reveal][data-rarity="skill"]')).toHaveCount(2);
  await expect(page.locator('[data-loot-reveal]:not([data-rarity="skill"])')).toHaveCount(4);
  await page.locator('.gr-reward-actions button').first().click();

  await expect(page.getByRole('region', { name: '公會訓練清單' })).toBeVisible();
  await page
    .getByRole('button', { name: /^裝備給/ })
    .first()
    .click();
  await expect(page.locator('.gr-status-line')).toContainText('已裝備');
  await page.getByRole('button', { name: '校準' }).first().click();
  await expect(page.getByText('打開技能配置', { exact: true })).toBeVisible();
  await page.locator('[data-guide-id="nav:skills"]').click();

  await expect(page.getByRole('heading', { name: '技能融合工坊' })).toBeVisible();
  const candidates = page.locator('.gr-fusion__candidates button');
  await expect(candidates).toHaveCount(2);
  await candidates.nth(0).click();
  await candidates.nth(1).click();
  await page.getByRole('button', { name: /融合已選 2 張技能/ }).click();
  await expect(page.getByText(/融合完成/)).toBeVisible();
  const fusedCard = page.locator('.gr-skill-card').filter({ hasText: '2★' }).first();
  await fusedCard.getByRole('button', { name: /裝備到第/ }).click();
  await expect(page.getByText(/下一位：/)).toBeVisible();

  await page.locator('[data-guide-id="nav:quest"]').click();
  await page.getByRole('button', { name: '再次狩獵' }).click();
  await expect(page.locator('.gr-battle')).toBeVisible();
  await expect(page.locator('.gr-battle-guide-strip')).toHaveCount(0);
  await expectBattlefieldVisible(page);
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

  await expect(page.getByText('公會紀錄已載入。')).toBeVisible();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('expedition:guild-rpg:v4')!).version),
  ).toBe(4);
  expect(
    await page.evaluate(() => localStorage.getItem('expedition:guild-rpg:v3:backup')),
  ).not.toBeNull();

  for (const pageId of ['quest', 'party', 'skills', 'equipment']) {
    await page.locator(`[data-guide-id="nav:${pageId}"]`).click();
    await expectNoHorizontalCrop(page);
  }
  await expect(page.getByRole('button', { name: '布蘭' })).toBeVisible();
});
