import { describe, expect, it } from 'vitest';

import { createPlayableSession } from './create-playable-session';
import { createBattlefieldSources } from './create-battlefield-sources';

describe('createBattlefieldSources', () => {
  it('projects all live units and the Greyfang pack without owning battle rules', () => {
    const session = createPlayableSession();
    const sources = createBattlefieldSources(session.battle);

    expect(sources).toHaveLength(5);
    expect(sources.map(({ id }) => id)).toContain('greyfang-pack');
    expect(sources.find(({ id }) => id === 'ironwall-heavy')?.troopCount).toBe(
      session.battle.units[0]?.troopCount,
    );
  });
});
