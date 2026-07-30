import { _decorator, Component, ResolutionPolicy, screen, view } from 'cc';

import {
  calculateRewards,
  chooseNextHero,
  createProfile,
  resolveDesignResolution,
  startQuest,
  previewSkill,
  resolveAction,
} from '../../runtime/expedition-runtime.mjs';
import { BattleScene } from '../battle/BattleScene';
import type { ExpeditionRuntime } from '../runtime/RuntimeContracts';

const { ccclass } = _decorator;

@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
  private controller?: BattleScene;

  start(): void {
    this.applyFrameResolution();
    const runtime: ExpeditionRuntime = {
      calculateRewards,
      chooseNextHero,
      createProfile,
      startQuest,
      previewSkill,
      resolveAction,
    };
    const profile = runtime.createProfile();
    const questId = profile.unlockedQuestIds[0];
    if (!questId) throw new Error('Project Expedition has no unlocked quest');
    const battle = runtime.startQuest(profile, questId);
    const heroes = battle.units.filter(({ side }) => side === 'heroes');
    const enemies = battle.units.filter(({ side }) => side === 'enemies');
    if (heroes.length !== 6) throw new Error(`Expected 6 heroes, received ${heroes.length}`);
    if (enemies.length !== 3) throw new Error(`Expected 3 enemies, received ${enemies.length}`);

    this.controller = this.node.addComponent(BattleScene);
    this.controller.initialize({ runtime, profile, battle });
    screen.on('window-resize', this.handleResize, this);
  }

  onDestroy(): void {
    screen.off('window-resize', this.handleResize, this);
  }

  private readonly handleResize = (): void => {
    this.applyFrameResolution();
    this.controller?.reflow();
  };

  private applyFrameResolution(): void {
    const frame = view.getFrameSize();
    const resolution = resolveDesignResolution({ width: frame.width, height: frame.height });
    view.setDesignResolutionSize(resolution.width, resolution.height, ResolutionPolicy.EXACT_FIT);
  }
}
