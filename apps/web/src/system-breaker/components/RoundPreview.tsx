import type { GenomeCounter, SystemBreakerRoundPreview } from '@expedition/shared-types';

const roleText = {
  PRODUCER: '產出',
  AMPLIFIER: '增幅',
  STABILIZER: '穩定',
  DEFENSE: '防禦',
  CONVERTER: '轉換',
} as const;

export function RoundPreview(props: {
  preview: SystemBreakerRoundPreview;
  counter: GenomeCounter | null;
}) {
  return (
    <section className="sb-round-preview" aria-labelledby="round-preview-title">
      <header>
        <div>
          <p className="sb-kicker">CANONICAL ROUND PREVIEW</p>
          <h2 id="round-preview-title">本回合預測</h2>
        </div>
        <strong className={props.preview.success ? 'is-success' : 'is-failure'}>
          {props.preview.success ? '預測達標' : '預測未達標'}
        </strong>
      </header>
      <dl>
        <div>
          <dt>進度 / 目標</dt>
          <dd>
            {props.preview.projectedProgress} / {props.preview.targetProgress}
          </dd>
        </div>
        <div>
          <dt>完整度</dt>
          <dd>{props.preview.integrity}</dd>
        </div>
        <div>
          <dt>不穩定度</dt>
          <dd>{props.preview.instability}</dd>
        </div>
        <div>
          <dt>點數</dt>
          <dd>{props.preview.credits}</dd>
        </div>
        <div>
          <dt>連鎖</dt>
          <dd>
            觸發 {props.preview.triggeredCount} / 受阻 {props.preview.blockedCount}
          </dd>
        </div>
      </dl>
      {props.counter && (
        <p className="sb-round-preview__counter">
          反制：{roleText[props.counter.role]}（{props.counter.label}）輸出{' '}
          {props.counter.outputMultiplier}×
        </p>
      )}
    </section>
  );
}
