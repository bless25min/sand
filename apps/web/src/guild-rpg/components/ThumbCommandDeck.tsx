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
  guideMetrics?: readonly { label: string; value: string | number }[] | undefined;
  onSkipGuide?: (() => void) | undefined;
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
  guideMetrics,
  onSkipGuide,
  tabs = [],
  actions,
}: ThumbCommandDeckProps) {
  const visibleActions = guide?.focusId
    ? actions.filter((action) => `action:${action.id}` === guide.focusId)
    : actions;
  const visibleTabs = guide?.focusId
    ? tabs.filter((tab) => `tab:${tab.id}` === guide.focusId)
    : tabs;

  return (
    <aside
      className="gr-thumb-deck"
      data-thumb-command-deck="true"
      data-guide-active={guide ? 'true' : undefined}
      aria-label={ariaLabel}
    >
      {guide ? (
        <section className="gr-thumb-deck__guide" aria-live="polite">
          <span>
            {guide.phaseLabel} {guide.stepNumber}/{guide.stepTotal}
          </span>
          <strong>{guide.title}</strong>
          <p>{guide.message}</p>
          {guideMetrics && guideMetrics.length > 0 && (
            <div className="gr-thumb-deck__guide-metrics">
              {guideMetrics.map((metric) => (
                <span key={metric.label}>
                  <small>{metric.label}</small>
                  <b>{metric.value}</b>
                </span>
              ))}
            </div>
          )}
          {onSkipGuide && (
            <button type="button" className="gr-thumb-deck__skip" onClick={onSkipGuide}>
              略過引導
            </button>
          )}
        </section>
      ) : (
        <header className="gr-thumb-deck__header">
          <div>
            <span>{eyebrow}</span>
            <strong>{title}</strong>
          </div>
          {(feedback ?? status) && (
            <small className="gr-thumb-deck__status" aria-live={feedback ? 'polite' : undefined}>
              {feedback ?? status}
            </small>
          )}
        </header>
      )}
      <div className="gr-thumb-deck__body">
        <div className="gr-thumb-deck__actions">
          {visibleActions.map((action) => {
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
        {visibleTabs.length > 0 && (
          <nav className="gr-thumb-deck__tabs" aria-label={`${ariaLabel}分頁`}>
            {visibleTabs.map((tab) => {
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
