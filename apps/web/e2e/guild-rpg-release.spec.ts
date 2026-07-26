import { expect, test, type Page } from '@playwright/test';

test.setTimeout(30_000);

const expectNoHorizontalCrop = async (page: Page) => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
};

test('completes the fresh six-hero onboarding, hunt, fusion, equip, and replay loop', async ({
  page,
}) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');

  await expect(page.getByText('六人接力刷寶遠征', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: '主要遊戲介面' }).getByRole('button'),
  ).toHaveCount(4);
  await expectNoHorizontalCrop(page);

  await page.locator('[data-guide-id="nav:party"]').click();
  await expect(page.getByRole('heading', { name: '六人預設接力順序' })).toBeVisible();
  await page.locator('[data-guide-id="hero:first"]').click();
  await page.locator('[data-guide-id="nav:skills"]').click();
  await expect(page.getByRole('heading', { name: '目前角色：布蘭' })).toBeVisible();
  await expect(page.locator('[data-skill-slot]')).toHaveCount(6);
  await page.locator('[data-skill-slot="1"]').click();
  await page.locator('[data-guide-id="skill:equip"]').first().click();
  await expect(page.getByRole('heading', { name: '目前角色：萊拉' })).toBeVisible();

  await page.locator('[data-guide-id="nav:equipment"]').click();
  await expect(page.getByRole('heading', { name: '目前角色：萊拉' })).toBeVisible();
  await expect(page.getByText('武器', { exact: true })).toBeVisible();
  await page.locator('[data-guide-id="nav:quest"]').click();
  await page.locator('[data-guide-id="hunt:start"]').click();

  await expect(page.getByRole('heading', { name: /目前出手：/ })).toBeVisible();
  await expect(page.locator('[data-order-hero]')).toHaveCount(6);
  await expect(page.locator('[data-battle-skill]')).toHaveCount(6);
  await page.locator('[data-guide-id="target:first"]').click();
  await page.locator('[data-guide-id="battle:skill"]').click();
  await expect(page.locator('.gr-impact-stage')).toContainText('RELAY');
  await page.locator('[data-guide-id="order:next"]').first().click();

  for (let turn = 0; turn < 60 && (await page.locator('.gr-rewards').count()) === 0; turn += 1) {
    const collectVictory = page.locator('[data-guide-id="battle:collect"]');
    if ((await collectVictory.count()) > 0) {
      await collectVictory.click();
      break;
    }
    await page.locator('button[data-battle-skill]:not([disabled])').first().click();
  }

  await expect(page.locator('.gr-rewards')).toBeVisible();
  await expect(page.locator('.gr-reward-grid > div').nth(0).locator('article')).toHaveCount(2);
  await expect(page.locator('.gr-reward-grid > div').nth(1).locator('article')).toHaveCount(4);
  await expectNoHorizontalCrop(page);

  await page.locator('[data-guide-id="reward:equipment"]').click();
  await page.locator('[data-guide-id="equipment:equip"]').first().click();
  await expect(page.locator('.gr-status-line')).toContainText('已裝備');
  await page.locator('[data-guide-id="equipment:forge"]').first().click();
  await expect(page.getByRole('heading', { name: '技能融合工坊' })).toBeVisible();
  const candidates = page.locator('.gr-fusion__candidates button');
  await expect(candidates).toHaveCount(2);
  await candidates.nth(0).click();
  await candidates.nth(1).click();
  await page.locator('[data-guide-id="fusion:create"]').click();
  await expect(page.getByText(/融合完成/)).toBeVisible();
  await page.locator('[data-guide-id="skill:equip-fused"]').click();
  await expect(page.getByText(/下一位：艾琳/)).toBeVisible();

  await page.locator('[data-guide-id="nav:quest"]').click();
  await page.locator('[data-guide-id="hunt:replay"]').click();
  await expect(page.locator('.gr-battle')).toBeVisible();
  await expect(page.locator('.gr-coach')).toHaveCount(0);
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
