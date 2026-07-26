import { GUILD_ADVENTURERS } from '../adventurers';
import { GUILD_EQUIPMENT_BASES } from '../equipment';
import { GUILD_ELEMENTS } from './attributes';
import { GUILD_EQUIPMENT_CORES } from './equipment-cores';
import { GUILD_SKILL_FORMS } from './skill-forms';
import { GUILD_SKILL_SPECIALIZATIONS } from './specializations';
import { GUILD_TRIGGER_CONDITIONS } from './triggers';

export const validateSkillBuildContent = (): string[] => {
  const diagnostics: string[] = [];
  const unique = (label: string, ids: readonly string[]) => {
    if (new Set(ids).size !== ids.length) diagnostics.push(`duplicate_${label}`);
  };

  unique(
    'element',
    GUILD_ELEMENTS.map(({ id }) => id),
  );
  unique(
    'specialization',
    GUILD_SKILL_SPECIALIZATIONS.map(({ id }) => id),
  );
  unique(
    'trigger',
    GUILD_TRIGGER_CONDITIONS.map(({ id }) => id),
  );
  unique(
    'skill_form',
    GUILD_SKILL_FORMS.map(({ id }) => id),
  );
  unique(
    'core',
    GUILD_EQUIPMENT_CORES.map(({ id }) => id),
  );
  unique(
    'adventurer',
    GUILD_ADVENTURERS.map(({ id }) => id),
  );

  if (GUILD_ELEMENTS.length !== 3) diagnostics.push('element_count');
  if (GUILD_SKILL_SPECIALIZATIONS.length !== 6) diagnostics.push('specialization_count');
  if (GUILD_TRIGGER_CONDITIONS.length !== 30) diagnostics.push('trigger_count');
  if (GUILD_SKILL_FORMS.length !== 540) diagnostics.push('skill_form_count');
  if (GUILD_ADVENTURERS.length !== 6) diagnostics.push('adventurer_count');

  const skillIds = new Set(GUILD_SKILL_FORMS.map(({ id }) => id));
  for (const adventurer of GUILD_ADVENTURERS) {
    if (
      adventurer.starterSkillIds.length !== 6 ||
      adventurer.starterSkillIds.some((id) => !skillIds.has(id))
    ) {
      diagnostics.push(`invalid_starter_skills:${adventurer.id}`);
    }
  }

  const coreIds = new Set(GUILD_EQUIPMENT_CORES.map(({ id }) => id));
  for (const equipment of GUILD_EQUIPMENT_BASES) {
    if (equipment.coreIds.length === 0 || equipment.coreIds.some((id) => !coreIds.has(id))) {
      diagnostics.push(`invalid_core_pool:${equipment.id}`);
    }
  }

  return diagnostics;
};
