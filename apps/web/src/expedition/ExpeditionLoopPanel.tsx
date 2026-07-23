import { getMaterialDefinition, HORNPLATE_SHIELD } from '@expedition/game-data';
import type { MaterialId } from '@expedition/shared-types';

import type { MvpLoopSnapshot } from './create-mvp-loop-snapshot';

interface ExpeditionLoopPanelProps {
  readonly snapshot: MvpLoopSnapshot;
}

function recoveredQuantity(snapshot: MvpLoopSnapshot, materialId: MaterialId): number {
  return snapshot.recovered
    .filter((item) => item.materialId === materialId)
    .reduce((total, item) => total + item.quantity, 0);
}

export function ExpeditionLoopPanel({ snapshot }: ExpeditionLoopPanelProps) {
  const firstDrop = snapshot.drops[0];
  const defenseDelta = snapshot.after.frontalDefense - snapshot.before.frontalDefense;
  const weightDelta = snapshot.after.equipmentWeight - snapshot.before.equipmentWeight;
  const mobilityLoss = 1 - snapshot.after.mobility / snapshot.before.mobility;

  return (
    <section
      className="progression-panel"
      aria-labelledby="progression-title"
      data-testid="progression-loop"
    >
      <div className="progression-heading">
        <div>
          <p className="section-kicker">DETERMINISTIC EXPEDITION LOOP</p>
          <h2 id="progression-title">掉落如何改變下一場戰鬥</h2>
        </div>
        <span className="recipe-status">配方驗證完成</span>
      </div>

      <ol className="loop-grid">
        <li>
          <span className="loop-index">01</span>
          <p>戰場掉落</p>
          <strong>{snapshot.drops.length} 組定位素材</strong>
          <small>
            {firstDrop === undefined
              ? '無掉落'
              : `座標 ${firstDrop.position.x.toFixed(1)}, ${firstDrop.position.y.toFixed(1)}`}
          </small>
        </li>
        <li>
          <span className="loop-index">02</span>
          <p>戰後回收</p>
          <strong>{snapshot.recovered.length} 組全數帶回</strong>
          <small>{snapshot.remainingDrops.length} 組留在戰場</small>
        </li>
        <li>
          <span className="loop-index">03</span>
          <p>基地製造</p>
          <strong>{HORNPLATE_SHIELD.name}</strong>
          <small>狼皮、魔獸牙、角甲已扣除</small>
        </li>
        <li>
          <span className="loop-index">04</span>
          <p>再次戰鬥</p>
          <strong>第一重盾團已裝備</strong>
          <small>角甲覆面點群已投影到沙盤</small>
        </li>
      </ol>

      <div className="loop-evidence">
        <div className="material-ledger">
          {(['WOLF_PELT', 'MONSTER_FANG', 'HORN_PLATE'] as const).map((materialId) => (
            <div key={materialId}>
              <span>{getMaterialDefinition(materialId).name}</span>
              <strong>× {recoveredQuantity(snapshot, materialId)}</strong>
            </div>
          ))}
        </div>
        <dl className="tradeoff-ledger">
          <div>
            <dt>正面防禦</dt>
            <dd>
              {snapshot.before.frontalDefense} → {snapshot.after.frontalDefense}
              <em>+{defenseDelta}</em>
            </dd>
          </div>
          <div>
            <dt>裝備重量</dt>
            <dd>
              {snapshot.before.equipmentWeight} → {snapshot.after.equipmentWeight}
              <em>+{weightDelta}</em>
            </dd>
          </div>
          <div>
            <dt>移動能力</dt>
            <dd>
              {snapshot.before.mobility.toFixed(1)} → {snapshot.after.mobility.toFixed(1)}
              <em className="negative">−{Math.round(mobilityLoss * 100)}%</em>
            </dd>
          </div>
          <div>
            <dt>正面抗壓</dt>
            <dd>
              {Math.round(snapshot.before.defendingPressure).toLocaleString()} →{' '}
              {Math.round(snapshot.after.defendingPressure).toLocaleString()}
              <em>已生效</em>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
