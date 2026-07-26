import { GUILD_GAME_CONTENT } from '@expedition/game-data';
import { describe, expect, it } from 'vitest';

import { compileBuild } from '../combo/compile-build';
import { compileCommand } from '../combo/compile-command';
import { createGuildProfile } from './create-profile';
import { swapBuildLoadoutCard } from './swap-build-loadout-card';

describe('guild Build loadouts', () => {
  it('starts every Build with a legal eight-card signature loadout', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);

    for (const build of GUILD_GAME_CONTENT.builds) {
      const selected = { ...profile, selectedBuildId: build.id };
      const compiled = compileBuild(selected, GUILD_GAME_CONTENT);
      expect(compiled.cardIds, build.id).toEqual(build.defaultCardIds);
      expect(compiled.cardIds, build.id).toHaveLength(8);
      expect(
        compileCommand({ cardIds: build.signatureCardIds }, GUILD_GAME_CONTENT.cards).diagnostics,
        build.id,
      ).toEqual([]);
      expect(
        compileCommand({ cardIds: compiled.cardIds }, GUILD_GAME_CONTENT.cards).diagnostics,
        `${build.id}:full-loadout`,
      ).toEqual([]);
    }
  });

  it('swaps one reserve card without shrinking or duplicating the active loadout', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const build = GUILD_GAME_CONTENT.builds[0]!;
    const removedCardId = build.defaultCardIds[7]!;
    const addedCardId = build.cardIds.find((cardId) => !build.defaultCardIds.includes(cardId))!;

    const result = swapBuildLoadoutCard(
      profile,
      build.id,
      removedCardId,
      addedCardId,
      GUILD_GAME_CONTENT,
    );

    expect(result.profile.loadouts[build.id]).toHaveLength(8);
    expect(new Set(result.profile.loadouts[build.id]).size).toBe(8);
    expect(result.profile.loadouts[build.id]).toContain(addedCardId);
    expect(result.profile.loadouts[build.id]).not.toContain(removedCardId);
    expect(result.message).toContain(GUILD_GAME_CONTENT.cards[addedCardId]!.name);
  });

  it('rejects swaps that remove a signature card or strand cards behind missing tags', () => {
    const profile = createGuildProfile(GUILD_GAME_CONTENT);
    const build = GUILD_GAME_CONTENT.builds.find((candidate) => candidate.id === 'command_storm')!;

    const missingSignature = swapBuildLoadoutCard(
      profile,
      build.id,
      'lyra_quickshot',
      'lyra_killshot',
      GUILD_GAME_CONTENT,
    );
    const missingTagSource = swapBuildLoadoutCard(
      profile,
      build.id,
      'lyra_mark',
      'lyra_killshot',
      GUILD_GAME_CONTENT,
    );

    expect(missingSignature.profile).toBe(profile);
    expect(missingSignature.message).toContain('招牌');
    expect(missingTagSource.profile).toBe(profile);
    expect(missingTagSource.message).toContain('斷鏈');
  });
});
