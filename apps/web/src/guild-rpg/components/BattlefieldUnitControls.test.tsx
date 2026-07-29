import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import {
  createGuildProfile,
  previewEnemyPressure,
  startGuildQuest,
} from '@expedition/simulation-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createBattleScene } from '../presentation/battle-scene';
import { BattlefieldUnitControls } from './BattlefieldUnitControls';

describe('BattlefieldUnitControls', () => {
  it('attaches one compact enemy-response cue to the source and target units', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const battle = startGuildQuest(profile, 'border_pack', GUILD_GAME_CONTENT);
    const enemyIntent = previewEnemyPressure(battle)!;
    const scene = createBattleScene(battle, { relay: 1, enemyIntent });
    const html = renderToStaticMarkup(
      <BattlefieldUnitControls
        battle={battle}
        scene={scene}
        preferences={{
          version: 1,
          motion: 'system',
          tutorial: 'active',
          masterVolume: 0.45,
          musicEnabled: true,
          hapticsEnabled: true,
        }}
        tutorialStep="select_target"
        locked={false}
        onSelectTarget={() => undefined}
        onChooseHero={() => undefined}
      />,
    );

    expect(html).toContain(`data-enemy-intent-source="true"`);
    expect(html).toContain(`data-enemy-intent-target="true"`);
    expect(html).toContain(`data-enemy-intent-outcome="${enemyIntent.outcome}"`);
    expect(html).toContain('反擊');
  });
});
