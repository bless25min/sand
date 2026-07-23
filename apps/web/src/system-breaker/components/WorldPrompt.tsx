import { useState } from 'react';

const SAMPLES = ['會吞噬記憶的午夜圖書館', '每次說謊就加速的審判列車', '用情緒交易時間的失控市場'];

export function WorldPrompt(props: {
  prompt: string;
  generating: boolean;
  error: string | null;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onImport: (code: string) => void;
}) {
  const [runCode, setRunCode] = useState('');
  return (
    <section className="sb-prompt" aria-labelledby="world-prompt-title">
      <div className="sb-prompt__copy">
        <p className="sb-kicker">AI-NATIVE TEXT ROGUELIKE · 8–12 MIN</p>
        <h1 id="world-prompt-title">
          輸入一個世界。
          <br />
          <span>找出它的漏洞。</span>
        </h1>
        <p>
          AI 只負責改寫主題；勝敗、模組、經濟與七回合連鎖由固定規則執行。
          不需要角色圖、不需要裝備圖，只有你組出的系統會留下。
        </p>
      </div>
      <form
        className="sb-prompt__form"
        onSubmit={(event) => {
          event.preventDefault();
          props.onGenerate();
        }}
      >
        <label htmlFor="world-theme">世界主題</label>
        <textarea
          id="world-theme"
          value={props.prompt}
          maxLength={240}
          required
          autoFocus
          placeholder="例如：會吞噬記憶的午夜圖書館"
          onChange={(event) => props.onPromptChange(event.target.value)}
        />
        <div className="sb-input-meta">
          <span>自由輸入 1–240 字</span>
          <span>{props.prompt.length}/240</span>
        </div>
        <div className="sb-samples" aria-label="範例主題">
          {SAMPLES.map((sample) => (
            <button type="button" key={sample} onClick={() => props.onPromptChange(sample)}>
              {sample}
            </button>
          ))}
        </div>
        {props.error && (
          <p className="sb-error" role="alert">
            {props.error}
          </p>
        )}
        <button
          className="sb-primary sb-primary--large"
          type="submit"
          disabled={props.generating || props.prompt.trim().length === 0}
        >
          {props.generating ? '正在編譯世界…' : '生成可破壞系統'}
          <span aria-hidden="true">↗</span>
        </button>
      </form>
      <details className="sb-import">
        <summary>已有重播碼？</summary>
        <label htmlFor="run-code-import">貼上 SYSTEM BREAKER RUN CODE</label>
        <textarea
          id="run-code-import"
          value={runCode}
          onChange={(event) => setRunCode(event.target.value)}
        />
        <button type="button" onClick={() => props.onImport(runCode)} disabled={!runCode.trim()}>
          載入相同世界
        </button>
      </details>
    </section>
  );
}
