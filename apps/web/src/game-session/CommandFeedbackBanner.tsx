import type { CommandFeedback } from './create-command-feedback';

interface CommandFeedbackBannerProps {
  readonly feedback: CommandFeedback | null;
}

export function CommandFeedbackBanner({ feedback }: CommandFeedbackBannerProps) {
  if (feedback === null) {
    return (
      <div className="command-feedback command-feedback--idle" data-testid="command-feedback">
        <span>等待軍令</span>
        <p>選擇部隊並下達第一道命令。</p>
      </div>
    );
  }

  const showLosses = feedback.playerTroopLoss > 0 || feedback.monsterTroopLoss > 0;
  const showMorale = feedback.playerMoraleDelta !== 0 || feedback.monsterMoraleDelta !== 0;

  return (
    <div
      className={`command-feedback command-feedback--${feedback.tone}`}
      data-testid="command-feedback"
      data-action={feedback.action}
      role="status"
      aria-live="polite"
    >
      <span>{feedback.label}</span>
      <p>{feedback.summary}</p>
      {showLosses ? (
        <dl>
          <div>
            <dt>我軍傷亡</dt>
            <dd>-{feedback.playerTroopLoss}</dd>
          </div>
          <div>
            <dt>灰牙傷亡</dt>
            <dd>-{feedback.monsterTroopLoss}</dd>
          </div>
        </dl>
      ) : null}
      {showMorale ? (
        <small>
          士氣變化：我軍 {feedback.playerMoraleDelta}% · 灰牙 {feedback.monsterMoraleDelta}%
        </small>
      ) : null}
    </div>
  );
}
