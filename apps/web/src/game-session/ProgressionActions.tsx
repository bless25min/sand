import { getMaterialDefinition } from '@expedition/game-data';

import type { PlayableSessionAction, PlayableSessionState } from './playable-session-types';

interface ProgressionActionsProps {
  readonly state: PlayableSessionState;
  readonly dispatch: (action: PlayableSessionAction) => void;
}

export function ProgressionActions({ state, dispatch }: ProgressionActionsProps) {
  if (state.phase === 'LOOT') {
    return (
      <section className="progression-actions" aria-label="戰後回收">
        <h3>戰場已肅清</h3>
        <p>灰牙狼群留下 {state.drops.length} 組可回收素材。</p>
        {state.recoveredDropIds.length === 0 ? (
          <button type="button" onClick={() => dispatch({ type: 'RECOVER_LOOT' })}>
            回收全部素材
          </button>
        ) : (
          <button type="button" onClick={() => dispatch({ type: 'RETURN_TO_BASE' })}>
            返回基地
          </button>
        )}
      </section>
    );
  }

  if (state.phase !== 'BASE') return null;

  return (
    <section className="progression-actions" aria-label="基地整備">
      <h3>基地整備</h3>
      <ul>
        {state.inventory.stacks.map((stack) => (
          <li key={stack.materialId}>
            {getMaterialDefinition(stack.materialId).name} × {stack.quantity}
          </li>
        ))}
      </ul>
      {state.craftedEquipment === undefined && state.recoveredDropIds.length > 0 ? (
        <button type="button" onClick={() => dispatch({ type: 'CRAFT_SHIELD' })}>
          製造角甲重盾
        </button>
      ) : null}
      {state.craftedEquipment !== undefined && !state.shieldEquipped ? (
        <button type="button" onClick={() => dispatch({ type: 'EQUIP_SHIELD' })}>
          裝備第一重步兵團
        </button>
      ) : null}
      {state.shieldEquipped || state.recoveredDropIds.length === 0 ? (
        <button type="button" onClick={() => dispatch({ type: 'START_REMATCH' })}>
          進入強化再戰
        </button>
      ) : null}
    </section>
  );
}
