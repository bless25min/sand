import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { previewForgeEquipmentItem, type ForgeAction } from '@expedition/simulation-core';
import type { EquipmentItem } from '@expedition/shared-types';
import { useState } from 'react';

import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { InventoryItemCard } from './InventoryItemCard';

interface ForgeWorkbenchProps {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
  onClose?: () => void;
}

function ownedItems(state: GuildRpgState) {
  const equipped = state.profile.party.flatMap((member) =>
    Object.values(member.equipment).filter((item): item is EquipmentItem => Boolean(item)),
  );
  return [
    ...new Map([...equipped, ...state.profile.inventory].map((item) => [item.id, item])).values(),
  ];
}

export function ForgeWorkbench({ state, dispatch, onClose }: ForgeWorkbenchProps) {
  const items = ownedItems(state);
  const [selectedId, setSelectedId] = useState(items[0]?.id);
  const item = items.find((candidate) => candidate.id === selectedId) ?? items[0];
  const materials = Object.values(state.profile.materials).reduce((sum, value) => sum + value, 0);
  const previews = item
    ? Object.fromEntries(
        (['upgrade', 'infuse', 'reroll'] as const).map((action) => [
          action,
          previewForgeEquipmentItem(state.profile, item.id, action, GUILD_GAME_CONTENT),
        ]),
      )
    : {};
  const actionButton = (action: ForgeAction, label: string) => {
    const preview = previews[action];
    return (
      <button
        type="button"
        onClick={() => dispatch({ type: 'FORGE_ITEM', itemId: item!.id, forgeAction: action })}
      >
        <strong>{label}</strong>
        <span>
          {preview?.cost ?? 0}G + 1 {preview?.materialName ?? '未綁定素材'}
        </span>
        <small>{preview?.resultLabel ?? '無法預覽'}</small>
      </button>
    );
  };

  return (
    <section className="gr-longterm-panel gr-forge" aria-labelledby="forge-title">
      <header>
        <div>
          <p>
            FORGE · {state.profile.gold}G · {materials} MATERIALS
          </p>
          <h3 id="forge-title">鍛造工坊</h3>
        </div>
        <span>背包與已裝備物品都可直接鍛造；每次結果立即寫回同一件裝備。</span>
      </header>
      {item ? (
        <>
          <div className="gr-forge__items" aria-label="選擇鍛造裝備">
            {items.map((candidate) => (
              <button
                type="button"
                className={candidate.id === item.id ? 'is-selected' : ''}
                aria-pressed={candidate.id === item.id}
                key={candidate.id}
                onClick={() => setSelectedId(candidate.id)}
              >
                {candidate.name} {candidate.forgeRank ? `+${candidate.forgeRank}` : ''}
              </button>
            ))}
          </div>
          <div className="gr-forge__bench">
            <InventoryItemCard item={item} selected />
            <div className="gr-forge__actions">
              {actionButton('upgrade', '力量強化')}
              {actionButton('infuse', '規則灌注')}
              {actionButton('reroll', '詞綴重鑄')}
            </div>
          </div>
        </>
      ) : (
        <div className="gr-empty">先帶回或裝備一件戰利品，鍛爐就會立刻點燃。</div>
      )}
      {onClose && (
        <footer>
          <button type="button" onClick={onClose}>
            離開鍛爐
          </button>
        </footer>
      )}
    </section>
  );
}
