import { expect, test } from '@playwright/test';

test('renders one WebGL battlefield with the full visual point budget', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));

  await page.goto('/?prototype=expedition');

  await expect(page.getByRole('heading', { name: 'Project Expedition' })).toBeVisible();

  const battlefield = page.getByTestId('battlefield-canvas-host');
  await expect(battlefield).toHaveAttribute('data-point-count', '2000');
  await expect(battlefield).toHaveAttribute('data-renderer', /WebGL|WebGPU/);
  await expect(battlefield.locator('canvas')).toHaveCount(1);
  await battlefield.locator('canvas').evaluate((canvas) => {
    canvas.dataset.rendererIdentity = 'persistent';
  });
  await expect(page.getByRole('alert')).toHaveCount(0);

  const playable = page.getByTestId('playable-expedition');
  await expect(playable.getByTestId('unit-select')).toHaveCount(4);
  await playable.getByRole('button', { name: '推進' }).click();
  await expect(playable).toContainText('Tick1');
  await expect(battlefield.locator('canvas')).toHaveAttribute(
    'data-renderer-identity',
    'persistent',
  );
  await playable.getByRole('button', { name: '變換陣形' }).click();
  await expect(
    playable.getByTestId('unit-select').filter({ hasText: '第一重步兵團' }),
  ).toContainText('橫列');

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

  const evidence = page.locator('.developer-evidence');
  await expect(evidence).not.toHaveAttribute('open');
  await evidence.locator('summary').click();

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

test('keeps commands beside the battlefield and names every visible order result', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1_280, height: 720 });
  await page.goto('/?prototype=expedition');

  const playable = page.getByTestId('playable-expedition');
  const cockpit = playable.getByTestId('battle-cockpit');
  const battlefield = playable.getByTestId('battlefield-canvas-host');
  const commands = playable.locator('.command-bar');
  await expect(cockpit).toBeVisible();
  await expect(playable.getByText('擊潰灰牙狼群', { exact: true })).toBeVisible();
  await expect(playable.getByText('敵軍意圖', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThan(900);
  await cockpit.scrollIntoViewIfNeeded();

  const battlefieldBox = await battlefield.boundingBox();
  const commandBox = await commands.boundingBox();
  expect(battlefieldBox).not.toBeNull();
  expect(commandBox).not.toBeNull();
  if (battlefieldBox === null || commandBox === null) return;
  const verticalOverlap =
    Math.min(battlefieldBox.y + battlefieldBox.height, commandBox.y + commandBox.height) -
    Math.max(battlefieldBox.y, commandBox.y);
  expect(verticalOverlap).toBeGreaterThan(100);

  const assertOrder = async (button: string, expected: string) => {
    await playable.getByRole('button', { name: button }).click();
    await expect(playable.getByTestId('command-feedback')).toContainText(expected);
  };
  const reset = async () => {
    await playable.getByRole('button', { name: '重設相同 Seed' }).click();
  };

  await assertOrder('推進', '推進');
  await reset();
  await assertOrder('固守', '固守');
  await reset();
  await assertOrder('攻擊', '攻擊');
  await reset();
  await assertOrder('變換陣形', '橫列陣');
  await reset();
  await assertOrder('撤退', '撤退');
  await expect(playable.getByTestId('battlefield-unit-focus')).toHaveAttribute(
    'data-mode',
    'retreat',
  );
});

test('lets archers land a deterministic volley before contact', async ({ page }) => {
  await page.setViewportSize({ width: 1_280, height: 720 });
  await page.goto('/?prototype=expedition');

  const playable = page.getByTestId('playable-expedition');
  const battlefield = playable.getByTestId('battlefield-canvas-host');
  await expect(battlefield).toHaveAttribute('data-point-count', '2000');

  await playable.getByTestId('unit-select').filter({ hasText: '松望弓兵團' }).click();
  await expect(playable.getByRole('button', { name: '攻擊' })).toContainText('射程內齊射');

  for (let turn = 0; turn < 10; turn += 1) {
    await playable.getByRole('button', { name: '攻擊' }).click();
    if ((await playable.locator('.battlefield-impact--volley').count()) > 0) break;
  }

  await expect(playable.locator('.battlefield-impact--volley')).toContainText('箭雨命中');
  await expect(playable.locator('.battlefield-impact--volley')).toContainText('我軍無損');
  await expect(playable.getByText('箭雨命中', { exact: true }).first()).toBeVisible();
  await expect(playable.getByTestId('unit-select').filter({ hasText: '松望弓兵團' })).toContainText(
    '800',
  );
});
