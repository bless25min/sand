import { expect, test } from '@playwright/test';

test('renders one WebGL battlefield with the full visual point budget', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Project Expedition' })).toBeVisible();

  const battlefield = page.getByTestId('battlefield-canvas-host');
  await expect(battlefield).toHaveAttribute('data-point-count', '2000');
  await expect(battlefield.locator('canvas')).toHaveCount(1);
  await expect(page.getByText('Simulation Core', { exact: true })).toBeVisible();
  await expect(page.getByText('WebGL', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);

  const playable = page.getByTestId('playable-expedition');
  await expect(playable.getByTestId('unit-select')).toHaveCount(4);
  await playable.getByRole('button', { name: '推進' }).click();
  await expect(playable).toContainText('Tick1');
  await playable.getByRole('button', { name: '變換陣形' }).click();
  await expect(
    playable.getByTestId('unit-select').filter({ hasText: '第一重步兵團' }),
  ).toContainText('LINE');

  for (let turn = 0; turn < 10; turn += 1) {
    const attack = playable.getByRole('button', { name: '攻擊' });
    if ((await attack.count()) === 0) break;
    await attack.click();
  }

  await expect(playable.getByRole('heading', { name: '戰場已肅清' })).toBeVisible();
  await playable.getByRole('button', { name: '回收全部素材' }).click();
  await playable.getByRole('button', { name: '返回基地' }).click();
  await playable.getByRole('button', { name: '製造角甲重盾' }).click();
  await playable.getByRole('button', { name: '裝備第一重步兵團' }).click();
  await playable.getByRole('button', { name: '進入強化再戰' }).click();

  await expect(playable).toContainText('第 2 戰');
  await expect(
    playable.getByTestId('unit-select').filter({ hasText: '第一重步兵團' }),
  ).toContainText('角甲重盾');
  await expect(battlefield.locator('canvas')).toHaveCount(1);

  const progressionLoop = page.getByTestId('progression-loop');
  await expect(progressionLoop).toBeVisible();
  await expect(
    progressionLoop.getByRole('heading', {
      name: '掉落如何改變下一場戰鬥',
    }),
  ).toBeVisible();
  await expect(progressionLoop.getByText('角甲重盾', { exact: true })).toBeVisible();
  await expect(progressionLoop).toContainText('10 → 16');

  const legionGrowth = page.getByTestId('legion-growth');
  await expect(legionGrowth).toBeVisible();
  await expect(legionGrowth.getByTestId('growth-unit-card')).toHaveCount(2);
  await expect(legionGrowth.getByText('重盾衛隊', { exact: true })).toBeVisible();
  await expect(legionGrowth.getByText('獵獸射手', { exact: true })).toBeVisible();

  expect(pageErrors).toEqual([]);
});
