import {
  COMBO_EFFECT_KINDS,
  COMBO_SELECTOR_KINDS,
  COMBO_TRANSFORM_KINDS,
  COMBO_TRIGGER_KINDS,
  SPECTACLE_CUE_IDS,
  SPECTACLE_MOTIF_IDS,
  type ComboContent,
  type ContentDiagnostic,
  type GuildGameContent,
  type HuntDefinition,
} from '@expedition/shared-types';

const CARD_EFFECTS = new Set(['damage', 'heal', 'shield']);
const CARD_TARGETS = new Set(['self', 'selected_enemy', 'all_enemies', 'lowest_hp_ally']);
const RULE_EFFECTS = new Set<string>(COMBO_EFFECT_KINDS);
const TRIGGERS = new Set<string>(COMBO_TRIGGER_KINDS);
const SELECTORS = new Set<string>(COMBO_SELECTOR_KINDS);
const TRANSFORMS = new Set<string>(COMBO_TRANSFORM_KINDS);
const SPECTACLE_CUES = new Set<string>(SPECTACLE_CUE_IDS);
const SPECTACLE_MOTIFS = new Set<string>(SPECTACLE_MOTIF_IDS);

export function validateComboContent(content: ComboContent): readonly ContentDiagnostic[] {
  const diagnostics: ContentDiagnostic[] = [];
  const report = (code: string, path: string, message: string) => {
    diagnostics.push({ code, path, message });
  };

  for (const [cardId, card] of Object.entries(content.cards)) {
    if (!card.cueId || !SPECTACLE_CUES.has(card.cueId)) {
      report(
        'invalid_spectacle_cue',
        `cards.${cardId}.cueId`,
        `${card.cueId ?? 'missing'} 不受支援`,
      );
    }
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
    if (!rule.cueId || !SPECTACLE_CUES.has(rule.cueId)) {
      report(
        'invalid_spectacle_cue',
        `rules.${ruleId}.cueId`,
        `${rule.cueId ?? 'missing'} 不受支援`,
      );
    }
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
    if (!SPECTACLE_MOTIFS.has(build.accent)) {
      report('invalid_spectacle_motif', `builds.${index}.accent`, `${build.accent} 不受支援`);
    }
    build.cardIds.forEach((cardId) => {
      if (!content.cards[cardId]) {
        report('unknown_card', `builds.${index}.cardIds`, `${cardId} 不存在`);
      }
    });
    const defaultCardIds = build.defaultCardIds ?? [];
    if (defaultCardIds.length !== 8 || new Set(defaultCardIds).size !== defaultCardIds.length) {
      report(
        'invalid_default_loadout',
        `builds.${index}.defaultCardIds`,
        '預設牌組必須正好包含八張不重複卡牌',
      );
    }
    defaultCardIds.forEach((cardId) => {
      if (!content.cards[cardId] || !build.cardIds.includes(cardId)) {
        report('unknown_default_card', `builds.${index}.defaultCardIds`, `${cardId} 不在卡池中`);
      }
    });
    build.ruleIds.forEach((ruleId) => {
      if (!content.rules[ruleId]) {
        report('unknown_rule', `builds.${index}.ruleIds`, `${ruleId} 不存在`);
      }
    });
    (build.signatureCardIds ?? []).forEach((cardId) => {
      if (
        !content.cards[cardId] ||
        !build.cardIds.includes(cardId) ||
        !defaultCardIds.includes(cardId)
      ) {
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
    const spectacleCues = hunt.spectacleCues ?? [];
    const beats = spectacleCues.map((cue) => cue.beat);
    const requiredBeats = ['opening', 'execution', 'annihilation'] as const;
    if (
      spectacleCues.length !== 3 ||
      new Set(beats).size !== 3 ||
      !requiredBeats.every((beat) => beats.includes(beat))
    ) {
      report(
        'incomplete_hunt_spectacle',
        `hunts.${huntIndex}.spectacleCues`,
        '狩獵必須有 opening、execution、annihilation 三個節拍',
      );
    }
    for (const [cueIndex, cue] of spectacleCues.entries()) {
      if (!SPECTACLE_CUES.has(cue.cueId)) {
        report(
          'invalid_spectacle_cue',
          `hunts.${huntIndex}.spectacleCues.${cueIndex}.cueId`,
          `${cue.cueId} 不受支援`,
        );
      }
    }
    for (const [enemyIndex, enemy] of hunt.enemies.entries()) {
      const identity = enemy.spectacle;
      if (
        !identity ||
        [identity.family, identity.role, identity.palette, identity.aura, identity.defeat].some(
          (value) => value.trim() === '',
        )
      ) {
        report(
          'missing_enemy_spectacle',
          `hunts.${huntIndex}.enemies.${enemyIndex}.spectacle`,
          `${enemy.enemyId} 缺少完整奇觀身份`,
        );
      }
    }
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

export function validateCampaignContent(content: GuildGameContent): readonly ContentDiagnostic[] {
  const diagnostics: ContentDiagnostic[] = [...validateComboContent(content)];
  const report = (code: string, path: string, message: string) => {
    diagnostics.push({ code, path, message });
  };
  const buildIds = new Set(content.builds.map((build) => build.id));
  const ruleIds = new Set(Object.keys(content.rules));
  const questById = new Map(content.quests.map((quest) => [quest.id, quest]));
  const huntsByQuestId = new Map<string, HuntDefinition[]>();
  for (const hunt of content.hunts) {
    const candidates = huntsByQuestId.get(hunt.questId) ?? [];
    candidates.push(hunt);
    huntsByQuestId.set(hunt.questId, candidates);
  }

  const releaseCounts = [
    ['zones', content.zones.length, 4],
    ['quests', content.quests.length, 12],
    ['hunts', content.hunts.length, 12],
    ['builds', content.builds.length, 4],
    ['challenges', content.challenges.length, 48],
    ['ascensions', content.ascensions.length, 3],
  ] as const;
  for (const [path, actual, expected] of releaseCounts) {
    if (actual !== expected) {
      report('invalid_release_count', path, `${path} 需要 ${expected} 筆，收到 ${actual} 筆`);
    }
  }

  const zoneQuestIds = content.zones.flatMap((zone) => zone.questIds);
  if (
    zoneQuestIds.length !== content.quests.length ||
    zoneQuestIds.some((questId, index) => questId !== content.quests[index]?.id)
  ) {
    report('invalid_zone_quest_order', 'zones.questIds', '區域任務必須完整覆蓋戰役順序');
  }
  if (new Set(zoneQuestIds).size !== zoneQuestIds.length) {
    report('duplicate_zone_quest', 'zones.questIds', '同一任務不可重複出現在區域');
  }
  for (const [zoneIndex, zone] of content.zones.entries()) {
    if (zone.questIds.length !== 3) {
      report('invalid_zone_depth', `zones.${zoneIndex}.questIds`, '每區必須正好三場狩獵');
    }
    if (
      [zone.name, zone.subtitle, zone.description, zone.palette, zone.transitionLabel].some(
        (value) => value.trim() === '',
      )
    ) {
      report('incomplete_zone_identity', `zones.${zoneIndex}`, `${zone.id} 缺少區域識別`);
    }
    for (const questId of zone.questIds) {
      const quest = questById.get(questId);
      if (!quest) {
        report('unknown_zone_quest', `zones.${zoneIndex}.questIds`, `${questId} 不存在`);
      } else if (quest.zoneId !== zone.id) {
        report('mismatched_quest_zone', `quests.${questId}.zoneId`, `${questId} 區域歸屬不一致`);
      }
    }
  }

  const uniqueEnemyIds = new Set(
    content.quests.flatMap((quest) => quest.enemies.map((enemy) => enemy.id)),
  );
  const uniqueBossIds = new Set(
    content.hunts.flatMap((hunt) => (hunt.bossEnemyId ? [hunt.bossEnemyId] : [])),
  );
  if (uniqueEnemyIds.size !== 18) {
    report(
      'invalid_enemy_count',
      'quests.enemies',
      `需要 18 種敵人，收到 ${uniqueEnemyIds.size} 種`,
    );
  }
  if (uniqueBossIds.size !== 6) {
    report(
      'invalid_boss_count',
      'hunts.bossEnemyId',
      `需要 6 名 Boss，收到 ${uniqueBossIds.size} 名`,
    );
  }

  const pressureLabels = new Set<string>();
  const counterBriefs = new Set<string>();
  for (const [questIndex, quest] of content.quests.entries()) {
    const hunts = huntsByQuestId.get(quest.id) ?? [];
    if (hunts.length !== 1) {
      report(
        'invalid_quest_hunt_count',
        `quests.${questIndex}`,
        `${quest.id} 必須恰好對應一場狩獵`,
      );
      continue;
    }
    const hunt = hunts[0]!;
    const questEnemyIds = new Set(quest.enemies.map((enemy) => enemy.id));
    if (pressureLabels.has(hunt.pressureLabel) || hunt.pressureLabel.trim() === '') {
      report('invalid_hunt_pressure', `hunts.${hunt.id}.pressureLabel`, '每場壓力必須清楚且唯一');
    }
    pressureLabels.add(hunt.pressureLabel);
    if (counterBriefs.has(hunt.counterBrief) || hunt.counterBrief.trim() === '') {
      report('invalid_hunt_counter', `hunts.${hunt.id}.counterBrief`, '每場對策必須清楚且唯一');
    }
    counterBriefs.add(hunt.counterBrief);
    if (!hunt.annihilationChest) {
      report('missing_annihilation_chest', `hunts.${hunt.id}`, '每場都需要殲滅寶箱');
    }
    if (hunt.bossEnemyId && !questEnemyIds.has(hunt.bossEnemyId)) {
      report('unknown_campaign_boss', `hunts.${hunt.id}.bossEnemyId`, hunt.bossEnemyId);
    }
    const authoredEnemyIds = new Set(hunt.enemies.map((enemy) => enemy.enemyId));
    if (
      authoredEnemyIds.size !== questEnemyIds.size ||
      [...questEnemyIds].some((enemyId) => !authoredEnemyIds.has(enemyId))
    ) {
      report('mismatched_hunt_enemies', `hunts.${hunt.id}.enemies`, '任務與狩獵敵人必須一致');
    }
    for (const [enemyIndex, enemy] of hunt.enemies.entries()) {
      if (!questEnemyIds.has(enemy.enemyId)) {
        report('unknown_hunt_enemy', `hunts.${hunt.id}.enemies.${enemyIndex}`, enemy.enemyId);
      }
      if (!enemy.traits?.length || !enemy.equipment.length || !enemy.spectacle) {
        report(
          'incomplete_enemy_reward_identity',
          `hunts.${hunt.id}.enemies.${enemyIndex}`,
          `${enemy.enemyId} 缺少壓力、掉落或視覺身分`,
        );
      }
      for (const trait of enemy.traits ?? []) {
        for (const buildId of trait.counterBuildIds) {
          if (!buildIds.has(buildId)) {
            report('unknown_counter_build', `hunts.${hunt.id}.${trait.id}`, buildId);
          }
        }
      }
      for (const item of enemy.equipment) {
        for (const buildId of item.recommendedBuildIds) {
          if (!buildIds.has(buildId)) {
            report('unknown_drop_build', `hunts.${hunt.id}.${item.id}`, buildId);
          }
        }
        for (const ruleId of item.ruleIds ?? []) {
          if (!ruleIds.has(ruleId)) {
            report('unknown_drop_rule', `hunts.${hunt.id}.${item.id}`, ruleId);
          }
        }
      }
    }
  }

  const challengeIds = new Set<string>();
  for (const hunt of content.hunts) {
    const challenges = content.challenges.filter((challenge) => challenge.huntId === hunt.id);
    const kinds = new Set(challenges.map((challenge) => challenge.kind));
    if (
      challenges.length !== 4 ||
      !(['one_command', 'overkill', 'build_route', 'execution'] as const).every((kind) =>
        kinds.has(kind),
      )
    ) {
      report('invalid_hunt_challenges', `challenges.${hunt.id}`, '每場必須具備四種爽感挑戰');
    }
    for (const challenge of challenges) {
      if (challengeIds.has(challenge.id)) {
        report('duplicate_challenge', `challenges.${challenge.id}`, '挑戰 ID 不可重複');
      }
      challengeIds.add(challenge.id);
      if (challenge.questId !== hunt.questId) {
        report('mismatched_challenge_quest', `challenges.${challenge.id}`, challenge.questId);
      }
      if (
        challenge.kind === 'build_route' &&
        challenge.requiredBuildId !== undefined &&
        !buildIds.has(challenge.requiredBuildId)
      ) {
        report('unknown_challenge_build', `challenges.${challenge.id}`, 'Build 路線不存在');
      }
      if (
        challenge.kind === 'execution' &&
        !hunt.enemies.some((enemy) => enemy.enemyId === challenge.executionEnemyId)
      ) {
        report('unknown_challenge_execution', `challenges.${challenge.id}`, '處刑目標不存在');
      }
      if (
        challenge.kind === 'overkill' &&
        (!challenge.overkillThreshold || challenge.overkillThreshold <= 0)
      ) {
        report('invalid_challenge_threshold', `challenges.${challenge.id}`, 'Overkill 門檻無效');
      }
    }
  }
  if (
    new Set(content.ascensions.map((ascension) => ascension.id)).size !== 3 ||
    content.ascensions.some(
      (ascension) =>
        ascension.pressureMultiplier <= 1 ||
        !SPECTACLE_CUES.has(ascension.cueId) ||
        !SPECTACLE_MOTIFS.has(ascension.motif) ||
        ascension.routeLabel.trim() === '',
    )
  ) {
    report('invalid_ascensions', 'ascensions', 'Ascension 必須提供唯一壓力、路線與奇觀身分');
  }
  const codexCategories = new Set(content.codexEntries.map((entry) => entry.category));
  if (
    !(['enemy', 'equipment', 'rule', 'build', 'zone', 'challenge'] as const).every((category) =>
      codexCategories.has(category),
    )
  ) {
    report('incomplete_codex', 'codexEntries', '圖鑑缺少必要分類');
  }

  diagnostics.push(...validateHuntBossPhases(content.hunts));
  return diagnostics;
}
