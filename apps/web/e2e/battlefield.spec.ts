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

  const progressionLoop = page.getByTestId('progression-loop');
  await expect(progressionLoop).toBeVisible();
  await expect(
    progressionLoop.getByRole('heading', {
      name: '掉落如何改變下一場戰鬥',
    }),
  ).toBeVisible();
  await expect(progressionLoop.getByText('角甲重盾', { exact: true })).toBeVisible();
  await expect(progressionLoop).toContainText('10 → 16');

  expect(pageErrors).toEqual([]);
});
