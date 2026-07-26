import type { ComboContent, CompiledBuild, GuildProfile } from '@expedition/shared-types';

import { validateBuildLoadout } from '../profile/validate-build-loadout';

export function compileBuild(profile: GuildProfile, content: ComboContent): CompiledBuild {
  const build =
    content.builds.find((candidate) => candidate.id === profile.selectedBuildId) ??
    content.builds[0];
  if (!build) throw new Error('Combo content requires at least one build');

  const equipmentRuleIds = profile.party.flatMap((member) =>
    Object.values(member.equipment).flatMap((item) => item?.ruleIds ?? []),
  );
  const savedCards = profile.loadouts[build.id] ?? build.defaultCardIds;
  const cardIds = validateBuildLoadout(build, savedCards, content.cards).valid
    ? savedCards
    : build.defaultCardIds;
  return {
    buildId: build.id,
    cardIds: [...cardIds],
    ruleIds: [...new Set([...build.ruleIds, ...equipmentRuleIds])].filter((ruleId) =>
      Boolean(content.rules[ruleId]),
    ),
  };
}
