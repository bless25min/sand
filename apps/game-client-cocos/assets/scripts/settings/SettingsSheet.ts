import { BlockInputEvents, Component } from 'cc';

import type { RuntimeGuildAction, RuntimeGuildState } from '../runtime/RuntimeContracts';
import { COLORS, addButton, addPanel, addText, createUiNode } from '../ui/UiFactory';

export class SettingsSheet extends Component {
  initialize(
    state: RuntimeGuildState,
    width: number,
    height: number,
    dispatch: (action: RuntimeGuildAction) => void,
    onClose: () => void,
  ): void {
    this.node.addComponent(BlockInputEvents);
    addPanel(this.node, COLORS.ink, COLORS.gold);
    addText(
      createUiNode('SettingsTitle', this.node, width - 30, 52, 0, height / 2 - 38),
      '遊戲設定',
      28,
      COLORS.gold,
    );
    const rows = [
      {
        id: 'Audio',
        label: state.preferences.musicEnabled ? '音效：開' : '音效：關',
        action: {
          type: 'SET_AUDIO_ENABLED',
          enabled: !state.preferences.musicEnabled,
        },
      },
      {
        id: 'Haptics',
        label: state.preferences.hapticsEnabled ? '震動：開' : '震動：關',
        action: {
          type: 'SET_HAPTICS_ENABLED',
          enabled: !state.preferences.hapticsEnabled,
        },
      },
      {
        id: 'Motion',
        label: state.preferences.motion === 'reduced' ? '動態：精簡' : '動態：完整',
        action: {
          type: 'SET_MOTION',
          motion: state.preferences.motion === 'reduced' ? 'system' : 'reduced',
        },
      },
      {
        id: 'Tutorial',
        label: state.preferences.tutorial === 'active' ? '引導：進行中' : '重新開始引導',
        action: { type: 'SET_TUTORIAL', tutorial: 'active' },
      },
    ] as const;
    rows.forEach((row, index) => {
      const node = createUiNode(
        `Setting-${row.id}`,
        this.node,
        width - 44,
        48,
        0,
        height / 2 - 105 - index * 56,
      );
      addPanel(node);
      addText(node, row.label, 19);
      addButton(node, () => dispatch(row.action));
    });
    const volumeY = -height / 2 + 90;
    const less = createUiNode('VolumeLess', this.node, width * 0.24, 44, -width * 0.26, volumeY);
    addPanel(less);
    addText(less, '音量 −', 18);
    addButton(less, () =>
      dispatch({
        type: 'SET_MASTER_VOLUME',
        volume: Math.max(0, state.preferences.masterVolume - 0.1),
      }),
    );
    addText(
      createUiNode('Volume', this.node, width * 0.3, 44, 0, volumeY),
      `${Math.round(state.preferences.masterVolume * 100)}%`,
      20,
      COLORS.gold,
    );
    const more = createUiNode('VolumeMore', this.node, width * 0.24, 44, width * 0.26, volumeY);
    addPanel(more);
    addText(more, '音量 ＋', 18);
    addButton(more, () =>
      dispatch({
        type: 'SET_MASTER_VOLUME',
        volume: Math.min(1, state.preferences.masterVolume + 0.1),
      }),
    );
    const close = createUiNode('CloseSettings', this.node, width * 0.56, 44, 0, -height / 2 + 34);
    addPanel(close, COLORS.line, COLORS.gold);
    addText(close, '完成', 19, COLORS.ink);
    addButton(close, onClose);
  }
}
