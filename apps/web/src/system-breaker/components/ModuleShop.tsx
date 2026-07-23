import type { BoardCommand, ModuleInstance, SystemBreakerRun } from '@expedition/shared-types';

export function ModuleShop(props: {
  run: SystemBreakerRun;
  selectedInstanceId: string | null;
  disabled?: boolean;
  onSelect: (instanceId: string | null) => void;
  onCommand: (command: BoardCommand) => void;
}) {
  const placed = props.run.board.cells.flatMap((cell) => (cell.module ? [cell.module] : []));
  const all = [...props.run.inventory, ...placed];
  const duplicateFor = (instance: ModuleInstance) =>
    all.find(
      (candidate) =>
        candidate.instanceId !== instance.instanceId &&
        candidate.definitionId === instance.definitionId &&
        candidate.level === instance.level &&
        candidate.level === 1,
    );
  return (
    <aside className="sb-shop" aria-labelledby="shop-title">
      <header>
        <div>
          <p className="sb-kicker">ROUND OFFER</p>
          <h2 id="shop-title">模組市場</h2>
        </div>
        <button
          type="button"
          onClick={() => props.onCommand({ type: 'REFRESH' })}
          disabled={props.disabled || props.run.shop.refreshesRemaining < 1}
        >
          刷新 −2
        </button>
      </header>
      <div className="sb-offers">
        {props.run.shop.offers.map((offer, index) => {
          if (!offer)
            return (
              <div className="sb-offer sb-offer--sold" key={index}>
                SOLD
              </div>
            );
          const module = props.run.genome.modules.find(
            (definition) => definition.id === offer.definitionId,
          )!;
          return (
            <article
              className={`sb-offer sb-offer--${module.role.toLowerCase()}`}
              key={offer.offerId}
            >
              <span>{module.role}</span>
              <h3>{module.name}</h3>
              <p>{module.description}</p>
              <code>
                {module.trigger} → {module.effect}
              </code>
              <footer>
                <b>+{module.baseValue}</b>
                <button
                  type="button"
                  disabled={props.disabled}
                  onClick={() => props.onCommand({ type: 'BUY', offerIndex: index })}
                >
                  購買 {offer.price}
                </button>
              </footer>
            </article>
          );
        })}
      </div>
      <div className="sb-inventory">
        <p className="sb-kicker">未放置模組 · {props.run.inventory.length}</p>
        {props.run.inventory.length === 0 && <span>購買後會出現在這裡。</span>}
        {props.run.inventory.map((instance) => {
          const module = props.run.genome.modules.find(
            (definition) => definition.id === instance.definitionId,
          )!;
          const duplicate = duplicateFor(instance);
          return (
            <div
              className={props.selectedInstanceId === instance.instanceId ? 'is-selected' : ''}
              key={instance.instanceId}
            >
              <button
                type="button"
                disabled={props.disabled}
                onClick={() => props.onSelect(instance.instanceId)}
              >
                <strong>{module.name}</strong>
                <span>
                  LV.{instance.level} · {module.role}
                </span>
              </button>
              {duplicate && (
                <button
                  type="button"
                  disabled={props.disabled}
                  onClick={() =>
                    props.onCommand({
                      type: 'FUSE',
                      sourceInstanceId: instance.instanceId,
                      targetInstanceId: duplicate.instanceId,
                    })
                  }
                >
                  融合
                </button>
              )}
              <button
                type="button"
                disabled={props.disabled}
                onClick={() => props.onCommand({ type: 'SELL', instanceId: instance.instanceId })}
              >
                售
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
