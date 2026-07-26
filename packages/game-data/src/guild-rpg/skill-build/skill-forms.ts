import type { SkillFormDefinition } from '@expedition/shared-types';

import { GUILD_ELEMENTS } from './attributes';
import { GUILD_SKILL_SPECIALIZATIONS } from './specializations';
import { GUILD_TRIGGER_CONDITIONS } from './triggers';

const skillFormId = (elementId: string, specializationId: string, triggerId: string) =>
  `${elementId}.${specializationId}.${triggerId}`;

export const GUILD_SKILL_FORMS: readonly SkillFormDefinition[] = GUILD_ELEMENTS.flatMap((element) =>
  GUILD_SKILL_SPECIALIZATIONS.flatMap((specialization) =>
    GUILD_TRIGGER_CONDITIONS.map((trigger) => ({
      id: skillFormId(element.id, specialization.id, trigger.id),
      name: `${element.name}・${specialization.name}・${trigger.name}`,
      element: element.id,
      specializationId: specialization.id,
      triggerId: trigger.id,
    })),
  ),
);
