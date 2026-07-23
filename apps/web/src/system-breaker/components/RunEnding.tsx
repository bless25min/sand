import { useState } from 'react';

import type { SystemBreakerRun } from '@expedition/shared-types';
import { encodeRunCode } from '@expedition/simulation-core';

export function RunEnding(props: {
  run: SystemBreakerRun;
  onReplay: () => void;
  onNewWorld: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const victory = props.run.status === 'VICTORY';
  const ending = victory ? props.run.genome.endings.victory : props.run.genome.endings.defeat;
  const code = encodeRunCode(props.run.genome);
  return (
    <section className={`sb-ending ${victory ? 'sb-ending--victory' : 'sb-ending--defeat'}`}>
      <p className="sb-kicker">{victory ? 'SYSTEM BROKEN' : 'SYSTEM CORRECTED'}</p>
      <h1>{ending.title}</h1>
      <p>{ending.description}</p>
      <div className="sb-ending__score">
        <div>
          <span>SCORE</span>
          <strong>{props.run.score}</strong>
        </div>
        <div>
          <span>BREACHED</span>
          <strong>{props.run.completedThreats}/7</strong>
        </div>
        <div>
          <span>BEST CHAIN</span>
          <strong>{props.run.bestChain}</strong>
        </div>
      </div>
      {props.run.fragment && (
        <article className="sb-fragment">
          <span>SAVED SYSTEM FRAGMENT</span>
          <strong>{props.run.fragment.name}</strong>
          <p>下次進入相同模組時，基礎效果 +{props.run.fragment.bonus}。</p>
        </article>
      )}
      <label htmlFor="run-code-output">本局重播碼</label>
      <textarea id="run-code-output" value={code} readOnly />
      <div className="sb-ending__actions">
        <button
          type="button"
          className="sb-ghost"
          onClick={async () => {
            await navigator.clipboard?.writeText(code);
            setCopied(true);
          }}
        >
          {copied ? '已複製' : '複製重播碼'}
        </button>
        <button type="button" className="sb-ghost" onClick={props.onReplay}>
          同世界再來一局
        </button>
        <button type="button" className="sb-primary" onClick={props.onNewWorld}>
          生成新世界
        </button>
      </div>
    </section>
  );
}
