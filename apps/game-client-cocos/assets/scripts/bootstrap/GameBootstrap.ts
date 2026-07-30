import { _decorator, Component, ResolutionPolicy, screen, sys, view } from 'cc';

import {
  calculateRewards,
  chooseNextHero,
  createProfile,
  createGuildSessionController,
  resolveDesignResolution,
  runtimeContent,
  startQuest,
  previewSkill,
  resolveAction,
} from '../../runtime/expedition-runtime.mjs';
import type {
  ExpeditionRuntime,
  RuntimeContent,
  RuntimeGuildController,
} from '../runtime/RuntimeContracts';
import { GuildGameController } from './GuildGameController';

const { ccclass } = _decorator;

@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
  private controller?: GuildGameController;

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
    const session = createGuildSessionController({
      getItem: (key: string) => sys.localStorage.getItem(key),
      setItem: (key: string, value: string) => sys.localStorage.setItem(key, value),
    }) as RuntimeGuildController;
    this.controller = this.node.addComponent(GuildGameController);
    this.controller.initialize({
      runtime,
      controller: session,
      content: runtimeContent as RuntimeContent,
    });
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
