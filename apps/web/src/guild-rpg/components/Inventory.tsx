import { GUILD_GAME_CONTENT } from '@expedition/game-data';

import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';
import { InventoryItemCard } from './InventoryItemCard';

interface InventoryProps {
  state: GuildRpgState;
  dispatch: React.Dispatch<GuildRpgAction>;
}

export function Inventory({ state, dispatch }: InventoryProps) {
  return (
    <section className="gr-section gr-inventory" aria-labelledby="inventory-title">
      <div className="gr-section__heading">
        <div>
          <p>VAULT · {state.profile.inventory.length}/20</p>
          <h2 id="inventory-title">公會背包</h2>
        </div>
        <span>文字裝備同時提供數值與可編入 Build 的規則節點</span>
      </div>
      {state.profile.inventory.length === 0 ? (
        <div className="gr-empty">完成遠征並選擇「保留」，裝備就會出現在這裡。</div>
      ) : (
        <div className="gr-inventory-grid">
          {state.profile.inventory.map((item) => (
            <InventoryItemCard item={item} key={item.id}>
              <div className="gr-item__equip">
                {state.profile.party.map((member) => {
                  const hero = GUILD_GAME_CONTENT.adventurers.find(
                    (candidate) => candidate.id === member.definitionId,
                  )!;
                  return (
                    <button
                      type="button"
                      key={member.definitionId}
                      onClick={() =>
                        dispatch({
                          type: 'EQUIP_STORED',
                          itemId: item.id,
                          adventurerId: member.definitionId,
                        })
                      }
                    >
                      裝給{hero.name}
                    </button>
                  );
                })}
              </div>
            </InventoryItemCard>
          ))}
        </div>
      )}
    </section>
  );
}
