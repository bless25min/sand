import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import type { EquipmentItem } from '@expedition/shared-types';
import { previewForgeEquipmentItem, type ForgeAction } from '@expedition/simulation-core';

import { isFirstHuntCoachFocus } from '../onboarding/first-hunt-coach';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';

const ACTIONS = [
  { id: 'calibrate', name: '校準' },
  { id: 'reforge', name: '重鑄' },
  { id: 'lock', name: '保護核心' },
] as const satisfies readonly { id: ForgeAction; name: string }[];

export function EquipmentForgeActions({
  item,
  state,
  dispatch,
}: {
  item: EquipmentItem;
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}) {
  const coreProtected = state.profile.forgeLocks[item.id]?.includes('core') ?? false;
  const coachActive = isFirstHuntCoachFocus(
    state.preferences.tutorial,
    state.tutorialStep,
    'equipment:forge',
  );

  return (
    <details
      className="gr-forge-workbench"
      data-forge-workbench={item.id}
      open={coachActive || undefined}
    >
      <summary
        data-guide-id="equipment:forge"
        data-guide-active={coachActive}
        data-core-protected={coreProtected}
      >
        {coreProtected ? '核心已保護' : '鍛造'}
      </summary>
      <div className="gr-forge-workbench__panel">
        <header>
          <strong>{item.name}</strong>
          <span>{coreProtected ? '核心不會被移植覆蓋' : '先看結果與成本，再決定是否執行'}</span>
        </header>
        <div className="gr-forge-workbench__resources">
          <span>金幣 {state.profile.gold}</span>
          <span>每次鍛造消耗對應素材 1 份</span>
        </div>
        <div className="gr-forge-workbench__actions">
          {ACTIONS.map(({ id, name }) => {
            const options = id === 'lock' ? { lockField: 'core' as const } : undefined;
            const preview = previewForgeEquipmentItem(
              state.profile,
              item.id,
              id,
              GUILD_GAME_CONTENT,
              options,
            );
            if (!preview) return null;
            const materialCount = preview.materialId
              ? (state.profile.materials[preview.materialId] ?? 0)
              : 0;
            const unlocking = id === 'lock' && coreProtected;
            const canApply =
              unlocking || (materialCount >= 1 && state.profile.gold >= preview.cost);
            const actionName = unlocking ? '解除保護' : name;
            return (
              <button
                type="button"
                aria-label={actionName}
                data-forge-action={id}
                disabled={!canApply}
                key={id}
                onClick={() =>
                  dispatch({
                    type: 'FORGE_ITEM',
                    itemId: item.id,
                    forgeAction: id,
                    ...(options ? { options } : {}),
                  })
                }
              >
                <strong>
                  {actionName} · {preview.cost}
                </strong>
                <span>{preview.resultLabel}</span>
                {!unlocking && (
                  <small>
                    {preview.materialName ?? '素材'} {materialCount} / 1 · {preview.cost} 金幣
                  </small>
                )}
                {unlocking && <small>不消耗素材或金幣</small>}
              </button>
            );
          })}
        </div>
      </div>
    </details>
  );
}
