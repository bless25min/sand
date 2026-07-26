import type { ComboContent, CompiledBuild, GuildProfile } from '@expedition/shared-types';

import { validateBuildLoadout } from '../profile/validate-build-loadout';

export function compileBuild(profile: GuildProfile, content: ComboContent): CompiledBuild {
  const build = content.builds[0];
  if (!build) throw new Error('Combo content requires at least one build');

  const equipmentRuleIds = profile.party.flatMap((member) =>
    Object.values(member.equipment).flatMap((item) => item?.ruleIds ?? []),
  );
  const cardIds = validateBuildLoadout(build, build.defaultCardIds, content.cards).valid
    ? build.defaultCardIds
    : build.defaultCardIds;
  return {
    buildId: build.id,
    cardIds: [...cardIds],
    ruleIds: [...new Set([...build.ruleIds, ...equipmentRuleIds])].filter((ruleId) =>
      Boolean(content.rules[ruleId]),
    ),
  };
}
