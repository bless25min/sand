import {
  MODULE_EFFECT_IDS,
  MODULE_ROLE_COUNTS,
  MODULE_ROLE_IDS,
  MODULE_TARGET_IDS,
  MODULE_TRIGGER_IDS,
  THREAT_KIND_IDS,
  THREAT_MODIFIER_IDS,
  WORLD_RULE_IDS,
} from '@expedition/shared-types';
import type { GameGenome, GenomeValidation, ModuleRoleId } from '@expedition/shared-types';

const contains = (values: readonly string[], value: unknown): boolean =>
  typeof value === 'string' && values.includes(value);
const unique = (values: string[]): boolean => new Set(values).size === values.length;

export function validateGameGenome(genome: GameGenome): GenomeValidation {
  const issues: string[] = [];
  if (genome.version !== 1) issues.push('version');
  if (!genome.seed || !genome.title || !genome.premise) issues.push('identity');
  if (genome.rules.length !== 2 || !unique(genome.rules)) issues.push('rules');
  genome.rules.forEach((rule, index) => {
    if (!contains(WORLD_RULE_IDS, rule)) issues.push(`rules[${index}]`);
  });

  if (genome.modules.length !== 12) issues.push('modules.length');
  if (!unique(genome.modules.map((module) => module.id))) issues.push('modules.ids');
  const roleCounts = Object.fromEntries(MODULE_ROLE_IDS.map((role) => [role, 0])) as Record<
    ModuleRoleId,
    number
  >;
  genome.modules.forEach((module, index) => {
    if (!contains(MODULE_ROLE_IDS, module.role)) issues.push(`modules[${index}].role`);
    else roleCounts[module.role] += 1;
    if (!contains(MODULE_TRIGGER_IDS, module.trigger)) issues.push(`modules[${index}].trigger`);
    if (!contains(MODULE_EFFECT_IDS, module.effect)) issues.push(`modules[${index}].effect`);
    if (!contains(MODULE_TARGET_IDS, module.target)) issues.push(`modules[${index}].target`);
    if (!module.id || !module.name || !module.description) issues.push(`modules[${index}].text`);
    if (!Number.isInteger(module.baseValue) || module.baseValue < 0 || module.baseValue > 30)
      issues.push(`modules[${index}].baseValue`);
    if (!Number.isInteger(module.cost) || module.cost < 1 || module.cost > 20)
      issues.push(`modules[${index}].cost`);
    if (!Number.isInteger(module.cooldown) || module.cooldown < 0 || module.cooldown > 3)
      issues.push(`modules[${index}].cooldown`);
  });
  MODULE_ROLE_IDS.forEach((role) => {
    if (roleCounts[role] !== MODULE_ROLE_COUNTS[role]) issues.push(`modules.role.${role}`);
  });

  if (genome.threats.length !== 7) issues.push('threats.length');
  genome.threats.forEach((threat, index) => {
    if (threat.round !== index + 1) issues.push(`threats[${index}].round`);
    if (!contains(THREAT_KIND_IDS, threat.kind)) issues.push(`threats[${index}].kind`);
    if (!contains(THREAT_MODIFIER_IDS, threat.modifier)) issues.push(`threats[${index}].modifier`);
    if (threat.phaseTwoModifier && !contains(THREAT_MODIFIER_IDS, threat.phaseTwoModifier))
      issues.push(`threats[${index}].phaseTwoModifier`);
    if (!threat.id || !threat.name || !threat.telegraph) issues.push(`threats[${index}].text`);
  });
  if (genome.threats[6]?.kind !== 'BOSS') issues.push('threats[6].kind');
  if (genome.counters.length !== 3) issues.push('counters.length');
  if (!genome.endings.victory.title || !genome.endings.defeat.title) issues.push('endings');

  return { valid: issues.length === 0, issues: Array.from(new Set(issues)) };
}
