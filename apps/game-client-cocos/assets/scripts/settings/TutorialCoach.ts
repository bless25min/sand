import { Component, view } from 'cc';

import { createFirstHuntCoach } from '../../runtime/expedition-runtime.mjs';
import type { RuntimeGuildAction, RuntimeGuildState } from '../runtime/RuntimeContracts';
import { COLORS, addButton, addPanel, addText, createUiNode } from '../ui/UiFactory';

export class TutorialCoach extends Component {
  initialize(state: RuntimeGuildState, dispatch: (action: RuntimeGuildAction) => void): void {
    if (state.preferences.tutorial !== 'active') {
      this.node.destroy();
      return;
    }
    const visible = view.getVisibleSize();
    const coach = createFirstHuntCoach(state.preferences.tutorial, state.tutorialStep, {
      battleStatus: state.battle?.status,
    });
    if (!coach) {
      this.node.destroy();
      return;
    }
    const text = `${coach.title}・${coach.message}`;
    const node = createUiNode(
      'TutorialHint',
      this.node,
      visible.width * 0.9,
      52,
      0,
      visible.height / 2 - 94,
    );
    addPanel(node, COLORS.ink, COLORS.gold);
    addText(
      createUiNode('HintText', node, visible.width * 0.72, 48, -visible.width * 0.06),
      text,
      17,
      COLORS.gold,
    );
    const skip = createUiNode('SkipTutorial', node, visible.width * 0.14, 36, visible.width * 0.36);
    addPanel(skip);
    addText(skip, '略過', 14, COLORS.muted);
    addButton(skip, () => dispatch({ type: 'SET_TUTORIAL', tutorial: 'skipped' }));
  }
}
