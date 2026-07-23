import type { GameGenome } from '@expedition/shared-types';

const RULE_LABELS: Record<string, string> = {
  ADJACENCY_SURGE: '相鄰模組會提高輸出',
  HIGH_INSTABILITY_BONUS: '高失控值換取更高輸出',
  LOW_INTEGRITY_BONUS: '低完整度啟動緊急增幅',
  EDGE_CREDIT: '邊緣格位產生額外額度',
  CHAIN_MOMENTUM: '連鎖越長，後段越強',
  BALANCED_GRID: '多角色盤面獲得平衡加成',
};

export function WorldContract(props: {
  genome: GameGenome;
  source: 'AI' | 'FALLBACK' | 'RUN_CODE';
  onAccept: () => void;
  onBack: () => void;
}) {
  const { genome } = props;
  return (
    <section className="sb-contract" aria-labelledby="contract-title">
      <header>
        <div>
          <p className="sb-kicker">WORLD CONTRACT · SEED {genome.seed.slice(0, 12)}</p>
          <h1 id="contract-title">{genome.title}</h1>
        </div>
        <span className={`sb-source sb-source--${props.source.toLowerCase()}`}>
          {props.source === 'AI'
            ? 'AI 編譯'
            : props.source === 'RUN_CODE'
              ? '重播世界'
              : '安全生成'}
        </span>
      </header>
      <p className="sb-contract__premise">{genome.premise}</p>
      <div className="sb-contract__grid">
        <article>
          <span>勝利條件</span>
          <strong>{genome.winDescription}</strong>
        </article>
        <article>
          <span>崩潰條件</span>
          <strong>{genome.failDescription}</strong>
        </article>
      </div>
      <div className="sb-contract__rules">
        <p className="sb-kicker">本世界的兩條規則</p>
        {genome.rules.map((rule, index) => (
          <div key={rule}>
            <b>0{index + 1}</b>
            <span>{RULE_LABELS[rule]}</span>
            <code>{rule}</code>
          </div>
        ))}
      </div>
      <dl className="sb-aliases">
        {Object.entries(genome.aliases).map(([id, label]) => (
          <div key={id}>
            <dt>{id}</dt>
            <dd>{label}</dd>
          </div>
        ))}
      </dl>
      <footer>
        <button type="button" className="sb-ghost" onClick={props.onBack}>
          重新輸入
        </button>
        <button type="button" className="sb-primary" onClick={props.onAccept}>
          接受規則，開始破壞 <span aria-hidden="true">→</span>
        </button>
      </footer>
    </section>
  );
}
