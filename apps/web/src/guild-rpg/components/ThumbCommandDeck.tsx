import type { FirstHuntCoach } from '../onboarding/first-hunt-coach';

type ThumbDeckSlot = 'primary' | 'secondary' | 'choice-a' | 'choice-b' | 'utility';

interface ThumbDeckTab {
  id: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}

export interface ThumbDeckAction {
  id: string;
  label: string;
  detail?: string | undefined;
  slot: ThumbDeckSlot;
  disabled?: boolean;
  selected?: boolean;
  tone?: 'default' | 'primary' | 'danger';
  onPress: () => void;
}

interface ThumbCommandDeckProps {
  ariaLabel: string;
  eyebrow: string;
  title: string;
  status?: string | undefined;
  feedback?: string | undefined;
  guide?: FirstHuntCoach | undefined;
  tabs?: readonly ThumbDeckTab[];
  actions: readonly ThumbDeckAction[];
}

export function ThumbCommandDeck({
  ariaLabel,
  eyebrow,
  title,
  status,
  feedback,
  guide,
  tabs = [],
  actions,
}: ThumbCommandDeckProps) {
  return (
    <aside className="gr-thumb-deck" data-thumb-command-deck="true" aria-label={ariaLabel}>
      {feedback && (
        <p className="gr-thumb-deck__feedback" aria-live="polite">
          {feedback}
        </p>
      )}
      {guide ? (
        <section className="gr-thumb-deck__guide" aria-live="polite">
          <span>
            {guide.phaseLabel} {guide.stepNumber}/{guide.stepTotal}
          </span>
          <strong>{guide.title}</strong>
          <p>{guide.message}</p>
        </section>
      ) : (
        <header className="gr-thumb-deck__header">
          <div>
            <span>{eyebrow}</span>
            <strong>{title}</strong>
          </div>
          {status && <small>{status}</small>}
        </header>
      )}
      <div className="gr-thumb-deck__body">
        <div className="gr-thumb-deck__actions">
          {actions.map((action) => {
            const guideId = `action:${action.id}`;
            return (
              <button
                type="button"
                key={action.id}
                data-guide-id={guideId}
                data-guide-focus={guide?.focusId === guideId ? 'true' : undefined}
                data-thumb-slot={action.slot}
                data-tone={action.tone ?? 'default'}
                aria-pressed={action.selected}
                disabled={action.disabled}
                onClick={action.onPress}
              >
                <strong>{action.label}</strong>
                {action.detail && <span>{action.detail}</span>}
              </button>
            );
          })}
        </div>
        {tabs.length > 0 && (
          <nav className="gr-thumb-deck__tabs" aria-label={`${ariaLabel}分頁`}>
            {tabs.map((tab) => {
              const guideId = `tab:${tab.id}`;
              return (
                <button
                  type="button"
                  key={tab.id}
                  data-guide-id={guideId}
                  data-guide-focus={guide?.focusId === guideId ? 'true' : undefined}
                  aria-current={tab.selected ? 'page' : undefined}
                  onClick={tab.onSelect}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </aside>
  );
}
