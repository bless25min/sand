import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve('apps/game-client-cocos');
const readJson = async (relativePath) =>
  JSON.parse(await readFile(path.join(projectRoot, relativePath), 'utf8'));
const readSource = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');
const readWorkspaceSource = (relativePath) => readFile(path.resolve(relativePath), 'utf8');

describe('Cocos production client project', () => {
  const playerActions = [
    'NAVIGATE',
    'SELECT_SKILL_WORKSPACE',
    'SELECT_HERO',
    'SELECT_SKILL_SLOT',
    'EQUIP_SKILL',
    'MOVE_DEFAULT_HERO',
    'TOGGLE_FUSION_SKILL',
    'FUSE_SELECTED',
    'REPLACE_FUSED_COMPONENT',
    'MOVE_FUSED_COMPONENT',
    'DISMANTLE_SKILL',
    'START_QUEST',
    'SELECT_TARGET',
    'CHOOSE_NEXT_HERO',
    'RESET_CURRENT_ORDER',
    'SET_CARRY_ORDER',
    'USE_SKILL',
    'COLLECT_VICTORY',
    'EQUIP_REWARD_ITEM',
    'REPLAY_HUNT',
    'EQUIP_STORED',
    'FORGE_ITEM',
    'TOGGLE_ITEM_FLAG',
    'TOGGLE_SALVAGE_SELECTION',
    'SALVAGE_SELECTED',
    'GO_TO_EQUIPMENT',
    'GO_TO_FUSION',
    'RETURN_GUILD',
    'ABANDON_HUNT',
    'SET_MASTER_VOLUME',
    'SET_AUDIO_ENABLED',
    'SET_HAPTICS_ENABLED',
    'SET_MOTION',
    'SET_TUTORIAL',
  ];

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
    expect(bootstrap).toContain('createGuildSessionController');
    expect(bootstrap).toContain('sys.localStorage');
    expect(bootstrap).toContain('GuildGameController');
    expect(bootstrap).not.toContain('runtime.createProfile()');
  });

  it('boots through one persistent controller that switches guild, battle, and rewards', async () => {
    const [controller, guildScene, rewardScene, coach] = await Promise.all([
      readSource('assets/scripts/bootstrap/GuildGameController.ts'),
      readSource('assets/scripts/guild/GuildScene.ts'),
      readSource('assets/scripts/rewards/RewardScene.ts'),
      readSource('assets/scripts/settings/TutorialCoach.ts'),
    ]);

    expect(controller).toContain("state.screen === 'guild'");
    expect(controller).toContain("state.screen === 'battle'");
    expect(controller).toContain("state.screen === 'rewards'");
    expect(controller).toContain('controller.dispatch(action)');
    expect(controller).toContain('GuildScene');
    expect(controller).toContain('BattleScene');
    expect(controller).toContain('RewardScene');
    expect(controller).toContain('private activeBattle?: BattleScene');
    expect(controller).toContain('this.activeBattle.reflow()');
    expect(controller).toContain("if (state.screen === 'battle') this.renderCoach(state)");
    expect(guildScene).toContain('createFirstHuntCoach');
    expect(guildScene).toContain('startQuestPoint');
    expect(guildScene).toContain('navPoints');
    expect(rewardScene).toContain('createFirstHuntCoach');
    expect(rewardScene).toContain('firstEntryPoint');
    expect(rewardScene).toContain('routePoints');
    expect(coach).toContain('createFirstHuntCoach');
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
    const [
      battleScene,
      skillDock,
      commandLens,
      actorAnimator,
      vfxDirector,
      damageNumbers,
      playback,
      audio,
    ] = await Promise.all(
      [
        'battle/BattleScene.ts',
        'battle/SkillDock.ts',
        'battle/CommandLens.ts',
        'playback/ActorAnimator.ts',
        'playback/VfxDirector.ts',
        'playback/DamageNumberPool.ts',
        'playback/PlaybackDirector.ts',
        'playback/AudioDirector.ts',
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
    expect(battleScene).toContain('input.state.preferences');
    expect(battleScene).toContain('try {');
    expect(battleScene).toContain('finally {');
    expect(battleScene).toContain('this.playback?.cancel()');
    expect(playback).toContain('reducedMotion');
    expect(playback).toContain('hapticsEnabled');
    expect(audio).toContain('masterVolume');
    expect(audio).toContain('enabled');
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
    expect(battleScene).toContain("type: 'CHOOSE_NEXT_HERO'");
    expect(battleScene).toContain("type: 'USE_SKILL'");
    expect(battleScene).toContain('this.battle!.roundOrder.activeAdventurerId');
    expect(battleScene).not.toContain('private readonly actedIds');
    expect(battleScene).not.toContain('roundOrder: string[]');
    expect(turnOrder).toContain('setOrder(');
    expect(turnOrder).not.toContain('moveBefore(');
    expect(battleScene).toContain('this.battle!.selectedTargetId');
    expect(battleScene).toContain("filter(({ side }) => side === 'enemies')");
    expect(battleScene).toContain("if (this.battle?.status === 'victory')");
    expect(battleScene).toContain('this.showVictoryConfirmation();');
    expect(battleScene).toContain("type: 'COLLECT_VICTORY'");
    expect(unitView).toContain("unit.side === 'enemies' || unit.currentHp > 0");
    expect(unitView).toContain('・處刑');
  });

  it('exposes every reward route through the persistent session', async () => {
    const rewardScene = await readSource('assets/scripts/rewards/RewardScene.ts');

    expect(rewardScene).toContain("type: 'EQUIP_REWARD_ITEM'");
    expect(rewardScene).toContain("type: 'RETURN_GUILD'");
    expect(rewardScene).toContain("type: 'GO_TO_EQUIPMENT'");
    expect(rewardScene).toContain("type: 'GO_TO_FUSION'");
    expect(rewardScene).toContain("type: 'REPLAY_HUNT'");
    expect(rewardScene).toContain('entries.slice(0, 20)');
  });

  it('keeps equipment, fusion, quest and unit interactions complete on a fixed screen', async () => {
    const [equipment, fusion, forge, quest, unit, loot] = await Promise.all(
      [
        'guild/EquipmentPage.ts',
        'guild/FusionWorkbench.ts',
        'guild/ForgeSheet.ts',
        'guild/QuestPage.ts',
        'battle/UnitView.ts',
        'rewards/LootItemView.ts',
      ].map((relativePath) => readSource(`assets/scripts/${relativePath}`)),
    );

    expect(equipment).toContain('this.openItem(item)');
    expect(forge).toContain('目前裝備');
    expect(fusion).toContain('candidatePage');
    expect(fusion).toContain('fusedPage');
    expect(fusion).toContain('FusionCandidateNext');
    expect(fusion).toContain('FusionSkillNext');
    expect(quest).toContain('if (unlocked)');
    expect(quest).toContain("'未解鎖'");
    expect(unit).not.toContain('MOUSE_UP');
    expect(loot).not.toContain('MOUSE_UP');
  });

  it('provides a direct Cocos interaction for all 34 player actions', async () => {
    const files = await readdir(path.join(projectRoot, 'assets/scripts'), { recursive: true });
    const sources = await Promise.all(
      files
        .filter((file) => file.endsWith('.ts'))
        .map((file) => readSource(`assets/scripts/${file.replaceAll('\\', '/')}`)),
    );
    const combined = sources.join('\n');

    expect(playerActions).toHaveLength(34);
    playerActions.forEach((action) => {
      expect(combined, `missing Cocos interaction for ${action}`).toContain(`type: '${action}'`);
    });
  });

  it('avoids Set spread that Creator loose transforms into non-serializable objects', async () => {
    const runtimeSources = await Promise.all(
      [
        'packages/simulation-core/src/guild-rpg/combo/compile-build.ts',
        'packages/simulation-core/src/guild-rpg/equipment/forge-equipment.ts',
        'packages/simulation-core/src/guild-rpg/progression/migrate-profile-v4.ts',
        'packages/simulation-core/src/guild-rpg/progression/replay-progression.ts',
        'packages/simulation-core/src/guild-rpg/rewards/create-hunt-equipment-item.ts',
        'packages/simulation-core/src/system-breaker/genome/validate-game-genome.ts',
      ].map(readWorkspaceSource),
    );

    const combined = runtimeSources.join('\n');
    expect(combined).not.toMatch(/\[\s*\.\.\.new Set\(/);
    expect(combined).toContain('Array.from(new Set(');
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
