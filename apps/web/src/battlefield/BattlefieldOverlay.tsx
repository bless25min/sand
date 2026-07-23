import type { BattlefieldOverlay as BattlefieldOverlayModel } from './create-battlefield-overlay';

const MODE_GLYPHS = {
  idle: '選',
  advance: '進',
  hold: '守',
  attack: '攻',
  formation: '陣',
  retreat: '退',
} as const;

export function BattlefieldOverlay({ overlay }: { readonly overlay: BattlefieldOverlayModel }) {
  return (
    <>
      {overlay.targetLine === undefined ? null : (
        <svg
          className={`battlefield-intent-line battlefield-intent-line--${overlay.mode}`}
          viewBox="0 0 1100 620"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line
            x1={overlay.targetLine.from.x}
            y1={overlay.targetLine.from.y}
            x2={overlay.targetLine.to.x}
            y2={overlay.targetLine.to.y}
          />
        </svg>
      )}
      {overlay.selected === undefined ? null : (
        <div
          className={`unit-focus-marker unit-focus-marker--${overlay.mode}`}
          style={{
            left: `${(overlay.selected.x / 1_100) * 100}%`,
            top: `${(overlay.selected.y / 620) * 100}%`,
          }}
          role="status"
          aria-label={overlay.accessibleLabel}
          data-testid="battlefield-unit-focus"
          data-mode={overlay.mode}
        >
          <span aria-hidden="true">{MODE_GLYPHS[overlay.mode]}</span>
        </div>
      )}
    </>
  );
}
