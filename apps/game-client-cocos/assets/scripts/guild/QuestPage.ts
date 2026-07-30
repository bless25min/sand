import { Component } from 'cc';

import type {
  RuntimeContent,
  RuntimeGuildAction,
  RuntimeGuildState,
} from '../runtime/RuntimeContracts';
import { COLORS, addButton, addPanel, addText, createUiNode } from '../ui/UiFactory';

export class QuestPage extends Component {
  private state?: RuntimeGuildState;
  private content?: RuntimeContent;
  private dispatch?: (action: RuntimeGuildAction) => void;
  private width = 0;
  private height = 0;
  private selectedZoneId?: string;
  private selectedQuestId?: string;
  private selectedAscensionId?: string;

  initialize(
    state: RuntimeGuildState,
    content: RuntimeContent,
    width: number,
    height: number,
    dispatch: (action: RuntimeGuildAction) => void,
  ): void {
    this.state = state;
    this.content = content;
    this.dispatch = dispatch;
    const firstQuestId = state.profile.unlockedQuestIds[0];
    const zone = content.zones.find(
      ({ questIds }) => firstQuestId && questIds.indexOf(firstQuestId) >= 0,
    );
    this.selectedZoneId = zone?.id ?? content.zones[0]?.id;
    this.selectedQuestId = firstQuestId ?? zone?.questIds[0];
    this.width = width;
    this.height = height;
    this.render();
  }

  private render(): void {
    this.node.removeAllChildren();
    const zoneHeight = 44;
    const zones = this.content!.zones;
    const zoneWidth = (this.width - 30) / Math.max(1, zones.length);
    zones.forEach((zone, index) => {
      const node = createUiNode(
        `Zone-${zone.id}`,
        this.node,
        zoneWidth - 6,
        zoneHeight,
        -this.width / 2 + 15 + zoneWidth / 2 + index * zoneWidth,
        this.height / 2 - zoneHeight / 2,
      );
      const selected = zone.id === this.selectedZoneId;
      addPanel(node, selected ? COLORS.line : COLORS.panel, selected ? COLORS.gold : COLORS.muted);
      addText(node, zone.name, 17, selected ? COLORS.ink : COLORS.text);
      addButton(node, () => {
        this.selectedZoneId = zone.id;
        this.selectedQuestId =
          zone.questIds.find((id) => this.state!.profile.unlockedQuestIds.indexOf(id) >= 0) ??
          zone.questIds[0];
        this.selectedAscensionId = undefined;
        this.render();
      });
    });

    const zone = zones.find(({ id }) => id === this.selectedZoneId) ?? zones[0];
    if (!zone) return;
    const questY = this.height / 2 - 92;
    const questWidth = (this.width - 38) / 3;
    zone.questIds.forEach((questId, index) => {
      const quest = this.content!.quests.find(({ id }) => id === questId);
      if (!quest) return;
      const unlocked = this.state!.profile.unlockedQuestIds.indexOf(questId) >= 0;
      const cleared = Boolean(this.state!.profile.questRecords?.[questId]);
      const selected = questId === this.selectedQuestId;
      const node = createUiNode(
        `Quest-${questId}`,
        this.node,
        questWidth,
        82,
        -this.width / 2 + 14 + questWidth / 2 + index * (questWidth + 5),
        questY,
      );
      addPanel(
        node,
        selected ? COLORS.line : COLORS.panel,
        selected ? COLORS.gold : unlocked ? COLORS.line : COLORS.muted,
      );
      addText(
        node,
        `${index + 1}. ${quest.name}\n${unlocked ? (cleared ? '已制霸' : '可出擊') : '未解鎖'}`,
        17,
        selected ? COLORS.ink : unlocked ? COLORS.text : COLORS.muted,
      );
      if (unlocked) {
        addButton(node, () => {
          this.selectedQuestId = questId;
          this.render();
        });
      }
    });

    const quest = this.content!.quests.find(({ id }) => id === this.selectedQuestId);
    if (!quest) return;
    const unlocked = this.state!.profile.unlockedQuestIds.indexOf(quest.id) >= 0;
    const detail = createUiNode('QuestDetail', this.node, this.width - 28, 150, 0, questY - 128);
    addPanel(detail);
    const clearCount = this.state!.profile.questRecords?.[quest.id]?.clears ?? 0;
    const challenges = this.content!.challenges.filter(({ questId }) => questId === quest.id)
      .map(
        (challenge) =>
          `${this.state!.profile.completedChallengeIds.indexOf(challenge.id) >= 0 ? '✓' : '◇'} ${challenge.name}`,
      )
      .join('　');
    addText(
      detail,
      `${quest.name}\n${quest.description}\n${challenges}\n最高紀錄 ${clearCount > 0 ? `${clearCount} 次制霸` : '尚未完成'}`,
      17,
    );

    const ascensions = [
      { id: undefined, name: '標準' },
      ...this.content!.ascensions.map(({ id, name }) => ({ id, name })),
    ];
    const ascensionWidth = (this.width - 36) / 4;
    ascensions.forEach((ascension, index) => {
      const node = createUiNode(
        `Ascension-${ascension.id ?? 'base'}`,
        this.node,
        ascensionWidth - 5,
        42,
        -this.width / 2 + 15 + ascensionWidth / 2 + index * ascensionWidth,
        questY - 236,
      );
      const selected = ascension.id === this.selectedAscensionId;
      addPanel(node, selected ? COLORS.line : COLORS.panel, selected ? COLORS.gold : COLORS.muted);
      addText(node, ascension.name, 15, selected ? COLORS.ink : COLORS.text);
      addButton(node, () => {
        this.selectedAscensionId = ascension.id;
        this.render();
      });
    });

    const start = createUiNode(
      'StartQuest',
      this.node,
      this.width * 0.72,
      62,
      0,
      -this.height / 2 + 42,
    );
    addPanel(start, unlocked ? COLORS.line : COLORS.panel, unlocked ? COLORS.gold : COLORS.muted);
    addText(
      start,
      unlocked ? `出擊・${quest.name}` : '未解鎖',
      25,
      unlocked ? COLORS.ink : COLORS.muted,
    );
    if (unlocked) {
      addButton(start, () =>
        this.dispatch?.({
          type: 'START_QUEST',
          questId: quest.id,
          ...(this.selectedAscensionId ? { ascensionId: this.selectedAscensionId } : {}),
        }),
      );
    }
  }
}
