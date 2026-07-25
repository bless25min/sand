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
  tabs?: readonly ThumbDeckTab[];
  actions: readonly ThumbDeckAction[];
}

export function ThumbCommandDeck({
  ariaLabel,
  eyebrow,
  title,
  status,
  feedback,
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
      <header className="gr-thumb-deck__header">
        <div>
          <span>{eyebrow}</span>
          <strong>{title}</strong>
        </div>
        {status && <small>{status}</small>}
      </header>
      <div className="gr-thumb-deck__body">
        <div className="gr-thumb-deck__actions">
          {actions.map((action) => (
            <button
              type="button"
              key={action.id}
              data-thumb-slot={action.slot}
              data-tone={action.tone ?? 'default'}
              aria-pressed={action.selected}
              disabled={action.disabled}
              onClick={action.onPress}
            >
              <strong>{action.label}</strong>
              {action.detail && <span>{action.detail}</span>}
            </button>
          ))}
        </div>
        {tabs.length > 0 && (
          <nav className="gr-thumb-deck__tabs" aria-label={`${ariaLabel}分頁`}>
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                aria-current={tab.selected ? 'page' : undefined}
                onClick={tab.onSelect}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </aside>
  );
}
