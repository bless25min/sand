import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve('apps/game-client-cocos');
const readJson = async (relativePath) =>
  JSON.parse(await readFile(path.join(projectRoot, relativePath), 'utf8'));
const readSource = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');

describe('Cocos production client project', () => {
  it('pins Creator 3.8.8 and exposes one boot scene backed by the real runtime', async () => {
    const packageJson = await readJson('package.json');
    const project = await readJson('project.json');
    const sceneMeta = await readJson('assets/main.scene.meta');
    const bootstrap = await readSource('assets/scripts/bootstrap/GameBootstrap.ts');

    expect(packageJson.creator.version).toBe('3.8.8');
    expect(project).toMatchObject({
      engine: 'cocos-creator',
      version: '3.8.8',
      entryScene: 'db://assets/main.scene',
    });
    expect(sceneMeta.importer).toBe('scene');
    expect(bootstrap).toContain("from '../../runtime/expedition-runtime.mjs'");
    expect(bootstrap).toContain('heroes.length !== 6');
    expect(bootstrap).toContain('enemies.length !== 3');
  });

  it('contains the complete battle, playback and reward adapters without owning outcomes', async () => {
    const sources = await Promise.all(
      [
        'battle/BattleScene.ts',
        'battle/UnitView.ts',
        'battle/SkillDock.ts',
        'battle/CommandLens.ts',
        'battle/TurnOrderController.ts',
        'playback/PlaybackDirector.ts',
        'playback/ActorAnimator.ts',
        'playback/CameraDirector.ts',
        'playback/VfxDirector.ts',
        'playback/AudioDirector.ts',
        'playback/DamageNumberPool.ts',
        'rewards/RewardScene.ts',
        'rewards/LootGrid.ts',
        'rewards/LootItemView.ts',
        'rewards/LootDetailSheet.ts',
      ].map((relativePath) => readSource(`assets/scripts/${relativePath}`)),
    );
    const combined = sources.join('\n');

    expect(combined).not.toMatch(/\bMath\.random\b/);
    expect(combined).not.toMatch(/\b(?:document|localStorage|window)\s*(?:\.|\[)/);
    expect(combined).not.toContain('currentHp -');
    expect(combined).toContain('compilePresentation');
    expect(combined).toContain('createLootLayout');
  });

  it('uses Creator-safe UI APIs and maps skill rarity from quality rather than damage', async () => {
    const [skillDock, turnOrder, unitView, rewardScene, runtimeContracts, uiFactory] =
      await Promise.all(
        [
          'battle/SkillDock.ts',
          'battle/TurnOrderController.ts',
          'battle/UnitView.ts',
          'rewards/RewardScene.ts',
          'runtime/RuntimeContracts.ts',
          'ui/UiFactory.ts',
        ].map((relativePath) => readSource(`assets/scripts/${relativePath}`)),
      );

    expect(skillDock).toContain('HorizontalTextAlignment.LEFT');
    expect(turnOrder).toContain('HorizontalTextAlignment.CENTER');
    expect(unitView).not.toContain('getComponent(Graphics)?.destroy()');
    expect(unitView).not.toContain('this.hpBar?.destroy()');
    expect(runtimeContracts).toContain('qualityRank: 1 | 2 | 3 | 4 | 5;');
    expect(rewardScene).toContain('RARITY_BY_RANK[component.qualityRank]');
    expect(rewardScene).not.toContain('RARITY_BY_RANK[component.power]');
    expect(uiFactory).toContain("createUiNode('Text', node");
  });

  it('keeps combat information readable and makes each relay visibly stronger', async () => {
    const [battleScene, skillDock, commandLens, actorAnimator, vfxDirector, damageNumbers] =
      await Promise.all(
        [
          'battle/BattleScene.ts',
          'battle/SkillDock.ts',
          'battle/CommandLens.ts',
          'playback/ActorAnimator.ts',
          'playback/VfxDirector.ts',
          'playback/DamageNumberPool.ts',
        ].map((relativePath) => readSource(`assets/scripts/${relativePath}`)),
      );

    expect(battleScene).toContain('const relayTier = this.battle!.roundOrder.actedIds.length + 1');
    expect(battleScene).toContain('resolveBattleFormation');
    expect(skillDock).not.toContain('const prefix =');
    expect(skillDock).toContain('const columns = desktop ? 6 : 3');
    expect(skillDock).toContain('處刑 +');
    expect(commandLens).toContain('actor.stats.attack');
    expect(commandLens).toContain('target?.stats.defense');
    expect(commandLens).toContain("' › '");
    expect(commandLens).toContain('preview.executionWindow');
    expect(commandLens).toContain('OVERKILL');
    expect(actorAnimator).toContain('Vec3.distance');
    expect(vfxDirector).toContain('Shockwave');
    expect(vfxDirector).toContain('RicochetPath');
    expect(vfxDirector).toContain('EchoPulse');
    expect(vfxDirector).toContain('HandoffOrbit');
    expect(vfxDirector).toContain('UIOpacity');
    expect(damageNumbers).toContain('node.setParent(target)');
  });

  it('uses simulation-owned turn state for hero selection, action and round reset', async () => {
    const [battleScene, turnOrder, runtimeContracts, unitView] = await Promise.all([
      readSource('assets/scripts/battle/BattleScene.ts'),
      readSource('assets/scripts/battle/TurnOrderController.ts'),
      readSource('assets/scripts/runtime/RuntimeContracts.ts'),
      readSource('assets/scripts/battle/UnitView.ts'),
    ]);

    expect(runtimeContracts).toContain('chooseNextHero(');
    expect(runtimeContracts).toContain('roundOrder: RuntimeRoundOrder;');
    expect(battleScene).toContain('this.runtime!.chooseNextHero(');
    expect(battleScene).toContain('this.battle!.roundOrder.activeAdventurerId');
    expect(battleScene).not.toContain('private readonly actedIds');
    expect(battleScene).not.toContain('roundOrder: string[]');
    expect(turnOrder).toContain('setOrder(');
    expect(turnOrder).not.toContain('moveBefore(');
    expect(battleScene).toContain('this.battle!.selectedTargetId');
    expect(battleScene).toContain("filter(({ side }) => side === 'enemies')");
    expect(battleScene).toContain("if (this.battle.status === 'victory')");
    expect(battleScene).toContain('this.showRewards();');
    expect(unitView).toContain("unit.side === 'enemies' || unit.currentHp > 0");
    expect(unitView).toContain('・處刑');
  });

  it.each([
    ['web-mobile', 'web-mobile', 'build/web-mobile'],
    ['web-desktop', 'web-desktop', 'build/web-desktop'],
    ['windows', 'windows', 'build/windows'],
  ])('defines a reproducible %s output', async (name, platform, buildPath) => {
    const config = await readJson(`build-config/${name}.json`);

    expect(config).toMatchObject({
      creatorVersion: '3.8.8',
      platform,
      buildPath,
      scenes: ['db://assets/main.scene'],
    });
  });
});
