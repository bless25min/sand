import {
  COMBO_EFFECT_KINDS,
  COMBO_SELECTOR_KINDS,
  COMBO_TRANSFORM_KINDS,
  COMBO_TRIGGER_KINDS,
  type ComboContent,
  type ContentDiagnostic,
  type HuntDefinition,
} from '@expedition/shared-types';

const CARD_EFFECTS = new Set(['damage', 'heal', 'shield']);
const CARD_TARGETS = new Set(['self', 'selected_enemy', 'all_enemies', 'lowest_hp_ally']);
const RULE_EFFECTS = new Set<string>(COMBO_EFFECT_KINDS);
const TRIGGERS = new Set<string>(COMBO_TRIGGER_KINDS);
const SELECTORS = new Set<string>(COMBO_SELECTOR_KINDS);
const TRANSFORMS = new Set<string>(COMBO_TRANSFORM_KINDS);

export function validateComboContent(content: ComboContent): readonly ContentDiagnostic[] {
  const diagnostics: ContentDiagnostic[] = [];
  const report = (code: string, path: string, message: string) => {
    diagnostics.push({ code, path, message });
  };

  for (const [cardId, card] of Object.entries(content.cards)) {
    card.effects.forEach((effect, index) => {
      if (!CARD_EFFECTS.has(effect.kind)) {
        report(
          'invalid_card_effect',
          `cards.${cardId}.effects.${index}`,
          `${effect.kind} 不受支援`,
        );
      }
      if (!CARD_TARGETS.has(effect.target)) {
        report(
          'invalid_card_target',
          `cards.${cardId}.effects.${index}`,
          `${effect.target} 不受支援`,
        );
      }
    });
  }

  for (const [ruleId, rule] of Object.entries(content.rules)) {
    if (!TRIGGERS.has(rule.trigger)) {
      report('invalid_trigger', `rules.${ruleId}.trigger`, `${rule.trigger} 不受支援`);
    }
    if (!SELECTORS.has(rule.selector)) {
      report('invalid_selector', `rules.${ruleId}.selector`, `${rule.selector} 不受支援`);
    }
    rule.effects.forEach((effect, index) => {
      if (!RULE_EFFECTS.has(effect.kind)) {
        report(
          'invalid_rule_effect',
          `rules.${ruleId}.effects.${index}`,
          `${effect.kind} 不受支援`,
        );
      }
    });
    rule.transforms.forEach((transform, index) => {
      if (!TRANSFORMS.has(transform)) {
        report('invalid_transform', `rules.${ruleId}.transforms.${index}`, `${transform} 不受支援`);
      }
    });
    rule.emitsTriggers?.forEach((trigger, index) => {
      if (!TRIGGERS.has(trigger)) {
        report('invalid_trigger', `rules.${ruleId}.emitsTriggers.${index}`, `${trigger} 不受支援`);
      }
    });
  }

  for (const [index, build] of content.builds.entries()) {
    build.cardIds.forEach((cardId) => {
      if (!content.cards[cardId]) {
        report('unknown_card', `builds.${index}.cardIds`, `${cardId} 不存在`);
      }
    });
    build.ruleIds.forEach((ruleId) => {
      if (!content.rules[ruleId]) {
        report('unknown_rule', `builds.${index}.ruleIds`, `${ruleId} 不存在`);
      }
    });
    (build.signatureCardIds ?? []).forEach((cardId) => {
      if (!content.cards[cardId] || !build.cardIds.includes(cardId)) {
        report(
          'unknown_signature_card',
          `builds.${index}.signatureCardIds`,
          `${cardId} 不在 Build 卡池中`,
        );
      }
    });
  }

  return diagnostics;
}

export function validateHuntBossPhases(
  hunts: readonly HuntDefinition[],
): readonly ContentDiagnostic[] {
  const diagnostics: ContentDiagnostic[] = [];
  const report = (code: string, path: string, message: string) => {
    diagnostics.push({ code, path, message });
  };

  for (const [huntIndex, hunt] of hunts.entries()) {
    const enemyIds = new Set(hunt.enemies.map((enemy) => enemy.enemyId));
    const phaseIds = new Set<string>();
    for (const [phaseIndex, phase] of (hunt.bossPhases ?? []).entries()) {
      const path = `hunts.${huntIndex}.bossPhases.${phaseIndex}`;
      if (phaseIds.has(phase.id)) {
        report('duplicate_boss_phase', `${path}.id`, `${phase.id} 重複`);
      }
      phaseIds.add(phase.id);
      if (!enemyIds.has(phase.bossEnemyId)) {
        report('unknown_boss_enemy', `${path}.bossEnemyId`, `${phase.bossEnemyId} 不存在`);
      }
      for (const enemyId of phase.activateAfterEnemyIds) {
        if (!enemyIds.has(enemyId)) {
          report('unknown_phase_activator', `${path}.activateAfterEnemyIds`, `${enemyId} 不存在`);
        }
      }
      if (phase.cueId.trim() === '') {
        report('missing_boss_phase_cue', `${path}.cueId`, '處決階段必須提供爽感提示');
      }
    }
  }

  return diagnostics;
}
