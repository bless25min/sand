import { describe, expect, it, vi } from 'vitest';

import { createDefaultGuildPreferences } from '../preferences/guild-preferences';
import type { CombatBeat } from '../presentation/combat-beats';
import { playCombatSensation } from './combat-sensation';

const beat = (relay: number, kind: CombatBeat['kind']): CombatBeat => ({
  id: `${relay}:${kind}`,
  kind,
  label: kind,
  relay,
  delayMs: 0,
  eventKind: kind === 'hit' ? 'damage' : 'relay',
});

describe('combat sensation output', () => {
  it('escalates optional haptics without making unsupported output fatal', () => {
    const vibrate = vi.fn(() => true);
    const tone = vi.fn();
    const preferences = createDefaultGuildPreferences(false);

    expect(() => playCombatSensation(beat(2, 'hit'), preferences, { vibrate, tone })).not.toThrow();
    playCombatSensation(beat(6, 'finisher'), preferences, { vibrate, tone });

    expect(vibrate).toHaveBeenNthCalledWith(1, [18, 24]);
    expect(vibrate).toHaveBeenNthCalledWith(2, [48, 30, 108]);
    expect(tone.mock.calls[1]?.[0]).toMatchObject({ frequency: 360, durationMs: 280 });
  });

  it('does nothing when sound and haptics are disabled', () => {
    const vibrate = vi.fn(() => true);
    const tone = vi.fn();
    const preferences = {
      ...createDefaultGuildPreferences(false),
      musicEnabled: false,
      hapticsEnabled: false,
    };

    playCombatSensation(beat(4, 'chain'), preferences, { vibrate, tone });

    expect(vibrate).not.toHaveBeenCalled();
    expect(tone).not.toHaveBeenCalled();
  });
});
