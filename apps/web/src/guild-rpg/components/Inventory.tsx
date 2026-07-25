import { GUILD_GAME_CONTENT } from '@expedition/game-data';

import { RARITY_LABEL, SLOT_LABEL, STAT_LABEL } from '../presenters';
import type { GuildRpgAction, GuildRpgState } from '../state/game-reducer';

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
        <span>純文字裝備；數值與搭配就是全部</span>
      </div>
      {state.profile.inventory.length === 0 ? (
        <div className="gr-empty">完成遠征並選擇「保留」，裝備就會出現在這裡。</div>
      ) : (
        <div className="gr-inventory-grid">
          {state.profile.inventory.map((item) => (
            <article className={`gr-item gr-rarity--${item.rarity}`} key={item.id}>
              <p>
                {RARITY_LABEL[item.rarity]} · {SLOT_LABEL[item.slot]}
              </p>
              <h3>{item.name}</h3>
              <strong>
                {STAT_LABEL[item.mainStat.stat]} +{item.mainStat.value}
              </strong>
              <span>
                {item.affixes.length
                  ? item.affixes
                      .map(
                        (affix) =>
                          `${affix.label ? `${affix.label} · ` : ''}${STAT_LABEL[affix.stat]} +${affix.value}`,
                      )
                      .join(' · ')
                  : '無附加屬性'}
              </span>
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
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
