import type { VisualUnitSource } from '@expedition/pixi-renderer';
import type { FixedOrderAction, Vec2 } from '@expedition/shared-types';

export type BattlefieldOverlayMode =
  | 'idle'
  | 'advance'
  | 'hold'
  | 'attack'
  | 'formation'
  | 'retreat';

export interface BattlefieldOverlay {
  readonly mode: BattlefieldOverlayMode;
  readonly selected?: {
    readonly unitId: string;
    readonly x: number;
    readonly y: number;
  };
  readonly targetLine?: {
    readonly from: Vec2;
    readonly to: Vec2;
  };
  readonly accessibleLabel: string;
}

export interface CreateBattlefieldOverlayInput {
  readonly sources: readonly VisualUnitSource[];
  readonly selectedUnitId: string;
  readonly action?: FixedOrderAction;
}

const MODES: Readonly<Record<FixedOrderAction, BattlefieldOverlayMode>> = {
  ADVANCE: 'advance',
  HOLD: 'hold',
  ATTACK: 'attack',
  CHANGE_FORMATION: 'formation',
  RETREAT: 'retreat',
};

const ACTION_LABELS: Readonly<Record<FixedOrderAction, string>> = {
  ADVANCE: '推進',
  HOLD: '固守',
  ATTACK: '攻擊',
  CHANGE_FORMATION: '變換陣形',
  RETREAT: '撤退',
};

export function createBattlefieldOverlay(
  input: CreateBattlefieldOverlayInput,
): BattlefieldOverlay {
  const source = input.sources.find(({ id }) => id === input.selectedUnitId);
  const mode = input.action === undefined ? 'idle' : MODES[input.action];

  if (source === undefined) {
    return {
      mode,
      accessibleLabel: '未選取部隊',
    };
  }

  const selected = {
    unitId: source.id,
    x: source.position.x,
    y: source.position.y,
  };
  const targetLine =
    input.action === 'ADVANCE' || input.action === 'ATTACK'
      ? {
          from: source.position,
          to: source.targetPosition,
        }
      : undefined;
  const accessibleLabel =
    input.action === undefined
      ? `已選取 ${source.id}`
      : input.action === 'RETREAT'
        ? `${source.id} 正在撤退`
        : `${source.id} 執行${ACTION_LABELS[input.action]}`;

  return {
    mode,
    selected,
    ...(targetLine === undefined ? {} : { targetLine }),
    accessibleLabel,
  };
}
