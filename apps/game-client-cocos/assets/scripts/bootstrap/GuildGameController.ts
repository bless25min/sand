import { Component, UITransform, view } from 'cc';
import type { Node } from 'cc';

import type {
  ExpeditionRuntime,
  RuntimeContent,
  RuntimeGuildAction,
  RuntimeGuildController,
  RuntimeGuildState,
} from '../runtime/RuntimeContracts';
import { BattleScene } from '../battle/BattleScene';
import { GuildScene } from '../guild/GuildScene';
import { RewardScene } from '../rewards/RewardScene';
import { TutorialCoach } from '../settings/TutorialCoach';
import { createUiNode } from '../ui/UiFactory';

interface GuildGameInitialization {
  runtime: ExpeditionRuntime;
  controller: RuntimeGuildController;
  content: RuntimeContent;
}

export class GuildGameController extends Component {
  private runtime?: ExpeditionRuntime;
  private controller?: RuntimeGuildController;
  private content?: RuntimeContent;
  private activeScreen?: Node;
  private coachNode?: Node;
  private activeBattle?: BattleScene;
  private activeState?: RuntimeGuildState;
  private unsubscribe?: () => void;

  initialize(input: GuildGameInitialization): void {
    this.runtime = input.runtime;
    this.controller = input.controller;
    this.content = input.content;
    this.activeState = this.controller.getState();
    this.unsubscribe = this.controller.subscribe((state) => {
      const previous = this.activeState;
      this.activeState = state;
      if (state.screen === 'battle' && previous?.screen === 'battle') {
        this.renderCoach(state);
        return;
      }
      this.render();
    });
    this.render();
  }

  dispatch(action: RuntimeGuildAction): RuntimeGuildState {
    if (!this.controller) throw new Error('Guild controller is not initialized.');
    return this.controller.dispatch(action);
  }

  reflow(): void {
    if (this.activeState?.screen === 'battle' && this.activeBattle) {
      this.activeBattle.reflow();
      return;
    }
    this.render();
  }

  onDestroy(): void {
    this.unsubscribe?.();
  }

  private render(): void {
    if (!this.controller || !this.runtime || !this.content) return;
    this.activeBattle = undefined;
    this.activeScreen?.destroy();
    const visible = view.getVisibleSize();
    const screenNode = createUiNode('ActiveScreen', this.node, visible.width, visible.height);
    this.activeScreen = screenNode;
    const state = this.controller.getState();

    if (state.screen === 'guild') {
      screenNode.addComponent(GuildScene).initialize({
        state,
        content: this.content,
        dispatch: (action) => this.dispatch(action),
      });
      this.coachNode?.destroy();
      return;
    }
    if (state.screen === 'battle' && state.battle) {
      this.activeBattle = screenNode.addComponent(BattleScene);
      this.activeBattle.initialize({
        runtime: this.runtime,
        controller: this.controller,
        state,
      });
      if (state.screen === 'battle') this.renderCoach(state);
      return;
    }
    if (state.screen === 'rewards' && state.rewards) {
      screenNode.addComponent(UITransform).setContentSize(visible.width, visible.height);
      screenNode.addComponent(RewardScene).initialize({
        state,
        content: this.content,
        width: visible.width,
        height: visible.height,
        dispatch: (action) => this.dispatch(action),
      });
      this.coachNode?.destroy();
    }
  }

  private renderCoach(state: RuntimeGuildState): void {
    this.coachNode?.destroy();
    const visible = view.getVisibleSize();
    const node = createUiNode('TutorialCoach', this.node, visible.width, visible.height);
    this.coachNode = node;
    node.addComponent(TutorialCoach).initialize(state, (action) => this.dispatch(action));
  }
}
