import type {
  EquipmentInstance,
  FixedOrderAction,
  FormationType,
  InventoryState,
  LootDrop,
  UnitState,
} from '@expedition/shared-types';
import type { PlayableBattleState } from '@expedition/simulation-core';

type PlayableSessionPhase = 'BATTLE' | 'LOOT' | 'BASE';

export interface PlayableSessionState {
  readonly seed: string;
  readonly phase: PlayableSessionPhase;
  readonly battleNumber: 1 | 2;
  readonly selectedUnitId: string;
  readonly battle: PlayableBattleState;
  readonly previousBattle?: PlayableBattleState;
  readonly army: readonly UnitState[];
  readonly drops: readonly LootDrop[];
  readonly inventory: InventoryState;
  readonly recoveredDropIds: readonly string[];
  readonly craftedEquipment?: EquipmentInstance;
  readonly shieldEquipped: boolean;
}

export type PlayableSessionAction =
  | { readonly type: 'SELECT_UNIT'; readonly unitId: string }
  | {
      readonly type: 'ISSUE_ORDER';
      readonly action: 'CHANGE_FORMATION';
      readonly formation: FormationType;
    }
  | {
      readonly type: 'ISSUE_ORDER';
      readonly action: Exclude<FixedOrderAction, 'CHANGE_FORMATION'>;
      readonly formation?: never;
    }
  | { readonly type: 'RECOVER_LOOT' }
  | { readonly type: 'RETURN_TO_BASE' }
  | { readonly type: 'CRAFT_SHIELD' }
  | { readonly type: 'EQUIP_SHIELD' }
  | { readonly type: 'START_REMATCH' }
  | { readonly type: 'RESET_SESSION' };
