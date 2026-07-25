import type { ComboContent, CompiledBuild, GuildProfile } from '@expedition/shared-types';

export function compileBuild(profile: GuildProfile, content: ComboContent): CompiledBuild {
  const build =
    content.builds.find((candidate) => candidate.id === profile.selectedBuildId) ??
    content.builds[0];
  if (!build) throw new Error('Combo content requires at least one build');

  const equipmentRuleIds = profile.party.flatMap((member) =>
    Object.values(member.equipment).flatMap((item) => item?.ruleIds ?? []),
  );
  return {
    buildId: build.id,
    cardIds: [...build.cardIds],
    ruleIds: [...new Set([...build.ruleIds, ...equipmentRuleIds])].filter((ruleId) =>
      Boolean(content.rules[ruleId]),
    ),
  };
}
