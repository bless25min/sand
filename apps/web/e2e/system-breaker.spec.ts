import { expect, test } from '@playwright/test';

import { createFallbackGameGenome } from '@expedition/simulation-core';

test('completes a seven-round system breaker run and reloads its run code', async ({ page }) => {
  await page.route('**/api/game-genomes', async (route) => {
    const input = route.request().postDataJSON() as { prompt: string; seed: string };
    const genome = createFallbackGameGenome(input);
    genome.modules.forEach((module) => {
      module.effect = 'ADD_PROGRESS';
      module.baseValue = 30;
      module.cost = 1;
    });
    genome.modules[9]!.effect = 'REVIVE';
    genome.threats.forEach((threat) => {
      threat.targetProgress = 1;
      threat.integrityDamage = 0;
      threat.instabilityGain = 0;
    });
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ genome, source: 'FALLBACK', seed: input.seed }),
    });
  });

  await page.goto('/');
  await expect(page).toHaveTitle(/SYSTEM BREAKER/);
  await page.getByRole('button', { name: '會吞噬記憶的午夜圖書館' }).click();
  await page.getByRole('button', { name: /生成可破壞系統/ }).click();
  await expect(page.getByText('安全生成', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /接受規則/ }).click();
  await page.getByLabel('播放速度').selectOption('0');

  for (let index = 0; index < 3; index += 1) {
    await page.locator('.sb-offer footer button').first().click();
  }
  for (let index = 0; index < 3; index += 1) {
    await page.locator('.sb-inventory > div > button:first-child').first().click();
    await page.locator('.sb-cell:has(.sb-cell__empty) .sb-cell__target').first().click();
  }

  for (let round = 1; round <= 7; round += 1) {
    await expect(page.locator('.sb-threat__round strong')).toHaveText(
      String(round).padStart(2, '0'),
    );
    await page.getByRole('button', { name: /執行本回合/ }).click();
  }

  await expect(page.getByRole('heading', { name: '系統已破壞' })).toBeVisible();
  await expect(page.getByText('SAVED SYSTEM FRAGMENT')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('system-breaker-fragment')))
    .not.toBeNull();
  const runCode = await page.getByLabel('本局重播碼').inputValue();
  expect(runCode).toMatch(/^SB1\./);

  await page.getByRole('button', { name: '生成新世界' }).click();
  await page.getByText('已有重播碼？').click();
  await page.getByLabel('貼上 SYSTEM BREAKER RUN CODE').fill(runCode);
  await page.getByRole('button', { name: '載入相同世界' }).click();
  await expect(page.getByText('重播世界', { exact: true })).toBeVisible();
});

test('keeps mobile entry usable and expedition behind the legacy route', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /輸入一個世界/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );

  await page.goto('/?legacy=1');
  await expect(page.getByRole('heading', { name: 'Project Expedition' })).toBeVisible();
  await expect(page.getByTestId('playable-expedition')).toBeVisible();
});
