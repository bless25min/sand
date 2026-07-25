import type { AdventurerDefinition, GuildAdventurer } from '@expedition/shared-types';
import { calculateAdventurerStats } from '@expedition/simulation-core';

import { ROLE_LABEL, SLOT_LABEL, STAT_LABEL } from '../presenters';

interface AdventurerCardProps {
  adventurer: GuildAdventurer;
  definition: AdventurerDefinition;
  isLeader: boolean;
  onSetLeader: () => void;
}

export function AdventurerCard({
  adventurer,
  definition,
  isLeader,
  onSetLeader,
}: AdventurerCardProps) {
  const stats = calculateAdventurerStats(adventurer, definition);
  const threshold = adventurer.level * 80;

  return (
    <article className={`gr-card gr-hero-card gr-role--${definition.role}`}>
      <header className="gr-card__header">
        <div className="gr-avatar" aria-hidden="true">
          {definition.name.slice(0, 1)}
        </div>
        <div>
          <p>{ROLE_LABEL[definition.role]}</p>
          <h3>{definition.name}</h3>
          <span>{definition.title}</span>
        </div>
        <b className="gr-level">Lv.{adventurer.level}</b>
      </header>

      <div className="gr-xp" aria-label={`經驗 ${adventurer.experience} / ${threshold}`}>
        <span style={{ width: `${Math.min(100, (adventurer.experience / threshold) * 100)}%` }} />
      </div>

      <dl className="gr-stats">
        {(Object.keys(stats) as (keyof typeof stats)[]).map((stat) => (
          <div key={stat}>
            <dt>{STAT_LABEL[stat]}</dt>
            <dd>{Math.round(stats[stat])}</dd>
          </div>
        ))}
      </dl>

      <ul className="gr-loadout" aria-label={`${definition.name}裝備`}>
        {(['weapon', 'armor', 'accessory'] as const).map((slot) => (
          <li key={slot}>
            <span>{SLOT_LABEL[slot]}</span>
            <strong>{adventurer.equipment[slot]?.name ?? '未裝備'}</strong>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={isLeader ? 'gr-button gr-button--leader' : 'gr-button gr-button--quiet'}
        onClick={onSetLeader}
        disabled={isLeader}
      >
        {isLeader ? '◆ 目前隊長' : '設為手動隊長'}
      </button>
    </article>
  );
}
