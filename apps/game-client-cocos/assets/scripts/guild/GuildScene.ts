import { Component, UITransform, view } from 'cc';

import { createFirstHuntCoach } from '../../runtime/expedition-runtime.mjs';
import type {
  RuntimeContent,
  RuntimeGuildAction,
  RuntimeGuildState,
} from '../runtime/RuntimeContracts';
import { COLORS, addButton, addPanel, addText, createUiNode } from '../ui/UiFactory';
import { SettingsSheet } from '../settings/SettingsSheet';
import { GuildNav } from './GuildNav';
import { PartyPage } from './PartyPage';
import { QuestPage } from './QuestPage';
import { SkillsPage } from './SkillsPage';
import { EquipmentPage } from './EquipmentPage';

interface GuildSceneInitialization {
  state: RuntimeGuildState;
  content: RuntimeContent;
  dispatch: (action: RuntimeGuildAction) => void;
}

export class GuildScene extends Component {
  initialize(input: GuildSceneInitialization): void {
    const visible = view.getVisibleSize();
    const mobile = visible.width < 720;
    const headerHeight = mobile ? 68 : 58;
    const navigationHeight = mobile ? 72 : 82;
    const coach = createFirstHuntCoach(input.state.preferences.tutorial, input.state.tutorialStep, {
      surface: 'guild',
    });
    const messageHeight = coach ? 58 : 34;
    const materialTotal = Object.keys(input.state.profile.materials).reduce(
      (sum, key) => sum + (input.state.profile.materials[key] ?? 0),
      0,
    );
    const root = createUiNode('GuildAppShell', this.node, visible.width, visible.height);
    root.setPosition(-visible.width / 2, -visible.height / 2);

    const header = createUiNode(
      'GuildHeader',
      root,
      visible.width,
      headerHeight,
      visible.width / 2,
      visible.height - headerHeight / 2,
    );
    addPanel(header, COLORS.ink, COLORS.line);
    addText(
      createUiNode('GuildTitle', header, visible.width * 0.42, headerHeight, -visible.width * 0.27),
      'PROJECT EXPEDITION',
      mobile ? 20 : 24,
      COLORS.gold,
    );
    addText(
      createUiNode('Resources', header, visible.width * 0.36, headerHeight, visible.width * 0.15),
      `金幣 ${input.state.profile.gold} · 素材 ${materialTotal}`,
      mobile ? 17 : 20,
    );
    const settings = createUiNode(
      'OpenSettings',
      header,
      visible.width * 0.12,
      40,
      visible.width * 0.43,
    );
    addPanel(settings);
    addText(settings, '設定', 16);
    addButton(settings, () => {
      const sheet = createUiNode(
        'SettingsSheet',
        root,
        visible.width * 0.82,
        visible.height * 0.62,
        visible.width / 2,
        visible.height / 2,
      );
      sheet
        .addComponent(SettingsSheet)
        .initialize(input.state, visible.width * 0.82, visible.height * 0.62, input.dispatch, () =>
          sheet.destroy(),
        );
    });

    const message = createUiNode(
      'StateMessage',
      root,
      visible.width,
      messageHeight,
      visible.width / 2,
      navigationHeight + messageHeight / 2,
    );
    addPanel(message, COLORS.panel, COLORS.line);
    const messageText = coach
      ? `引導 ${coach.stepNumber}/${coach.stepTotal}・${coach.title}\n${coach.message}`
      : input.state.message;
    addText(
      coach
        ? createUiNode(
            'StateMessageText',
            message,
            visible.width * 0.82,
            messageHeight,
            -visible.width * 0.07,
          )
        : message,
      messageText,
      coach ? 14 : 16,
      coach ? COLORS.gold : COLORS.muted,
    );
    if (coach) {
      const skip = createUiNode(
        'SkipTutorial',
        message,
        visible.width * 0.14,
        messageHeight - 10,
        visible.width * 0.42,
      );
      addPanel(skip);
      addText(skip, '略過', 14, COLORS.muted);
      addButton(skip, () => input.dispatch({ type: 'SET_TUTORIAL', tutorial: 'skipped' }));
    }

    const contentHeight = visible.height - headerHeight - navigationHeight - messageHeight;
    const partyCardHeight = 68;
    const content = createUiNode(
      `Page-${input.state.page}`,
      root,
      visible.width,
      contentHeight,
      visible.width / 2,
      navigationHeight + messageHeight + contentHeight / 2,
    );
    if (input.state.page === 'quest') {
      content
        .addComponent(QuestPage)
        .initialize(input.state, input.content, visible.width, contentHeight, input.dispatch);
    } else if (input.state.page === 'party') {
      content
        .addComponent(PartyPage)
        .initialize(input.state, input.content, visible.width, contentHeight, input.dispatch);
    } else if (input.state.page === 'skills') {
      content
        .addComponent(SkillsPage)
        .initialize(input.state, input.content, visible.width, contentHeight, input.dispatch);
    } else {
      content
        .addComponent(EquipmentPage)
        .initialize(input.state, input.content, visible.width, contentHeight, input.dispatch);
    }
    const focusNames = {
      quest: 'QuestDetail',
      party: 'HeroDetail',
      skills: 'SkillSelection',
      equipment: 'EquipmentFocus',
    } as const;
    const focusNode = content.getChildByName(focusNames[input.state.page]);
    const focusTransform = focusNode?.getComponent(UITransform);
    const pageNodes: {
      name: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }[] = [];
    for (const node of content.children) {
      const transform = node.getComponent(UITransform);
      if (!transform) continue;
      pageNodes.push({
        name: node.name,
        x: node.position.x,
        y: node.position.y,
        width: transform.contentSize.width,
        height: transform.contentSize.height,
      });
    }

    const nav = createUiNode(
      'GuildNavigation',
      root,
      visible.width,
      navigationHeight,
      visible.width / 2,
      navigationHeight / 2,
    );
    addPanel(nav, COLORS.ink, COLORS.line);
    nav
      .addComponent(GuildNav)
      .initialize(input.state.page, visible.width, navigationHeight, input.dispatch);

    (
      globalThis as typeof globalThis & {
        __EXPEDITION_DIAGNOSTICS__?: Record<string, unknown>;
      }
    ).__EXPEDITION_DIAGNOSTICS__ = {
      screen: 'guild',
      page: input.state.page,
      focusStage:
        focusNode && focusTransform
          ? {
              page: input.state.page,
              name: focusNode.name,
              width: focusTransform.contentSize.width,
              height: focusTransform.contentSize.height,
              x: focusNode.position.x,
              y: focusNode.position.y,
            }
          : undefined,
      pageNodes,
      width: visible.width,
      height: visible.height,
      partyCount: input.state.profile.party.length,
      destinationCount: 4,
      tutorialStep: input.state.tutorialStep,
      skillWorkspace: input.state.skillWorkspace,
      defaultOrder: input.state.profile.defaultOrder,
      selectedHeroId: input.state.selectedHeroId,
      startQuestPoint: {
        screenX: 0.5,
        screenY: 1 - (navigationHeight + messageHeight + 42) / visible.height,
      },
      navPoints: {
        quest: { screenX: 0.125, screenY: 1 - navigationHeight / 2 / visible.height },
        party: { screenX: 0.375, screenY: 1 - navigationHeight / 2 / visible.height },
        skills: { screenX: 0.625, screenY: 1 - navigationHeight / 2 / visible.height },
        equipment: { screenX: 0.875, screenY: 1 - navigationHeight / 2 / visible.height },
      },
      skillWorkspacePoints: {
        loadout: { screenX: 0.28, screenY: (headerHeight + 64) / visible.height },
        fusion: { screenX: 0.72, screenY: (headerHeight + 64) / visible.height },
      },
      equipSkillPoint: {
        screenX: 0.82,
        screenY: 1 - (navigationHeight + messageHeight + 82) / visible.height,
      },
      equipmentSlotPoints: [1 / 6, 1 / 2, 5 / 6].map((screenX) => ({
        screenX,
        screenY: (headerHeight + 84) / visible.height,
      })),
      partyHeroPoints: input.state.profile.defaultOrder.map((_heroId, index) => ({
        screenX: ((index % 3) + 0.5) / 3,
        screenY:
          (headerHeight +
            10 +
            partyCardHeight / 2 +
            Math.floor(index / 3) * (partyCardHeight + 8)) /
          visible.height,
      })),
      moveEarlierPoint: {
        screenX: 0.32,
        screenY: 1 - (navigationHeight + messageHeight + 42) / visible.height,
      },
      moveLaterPoint: {
        screenX: 0.68,
        screenY: 1 - (navigationHeight + messageHeight + 42) / visible.height,
      },
    };
  }
}
