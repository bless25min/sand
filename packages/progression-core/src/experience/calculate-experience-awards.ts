import type { ExperienceAward, ExperienceReason, ExperienceRule } from '@expedition/shared-types';

export interface CalculateExperienceAwardsInput {
  readonly awards: readonly ExperienceAward[];
  readonly rules: Readonly<Partial<Record<ExperienceReason, ExperienceRule>>>;
}

export type ExperienceCalculationFailureReason =
  'INVALID_QUANTITY' | 'MISSING_EVIDENCE' | 'MISSING_EXPERIENCE_RULE';

export interface ExperienceAwardDetail {
  readonly reason: ExperienceReason;
  readonly quantity: number;
  readonly awardedExperience: number;
  readonly evidenceIds: readonly string[];
}

export type ExperienceCalculationResult =
  | {
      readonly ok: true;
      readonly totalExperience: number;
      readonly details: readonly ExperienceAwardDetail[];
    }
  | {
      readonly ok: false;
      readonly reason: ExperienceCalculationFailureReason;
      readonly awardIndex: number;
    };

interface GroupedAward {
  quantity: number;
  evidenceIds: string[];
}

export function calculateExperienceAwards(
  input: CalculateExperienceAwardsInput,
): ExperienceCalculationResult {
  for (const [awardIndex, award] of input.awards.entries()) {
    if (!Number.isInteger(award.quantity) || award.quantity <= 0) {
      return { ok: false, reason: 'INVALID_QUANTITY', awardIndex };
    }

    if (award.evidenceIds.length === 0) {
      return { ok: false, reason: 'MISSING_EVIDENCE', awardIndex };
    }

    if (input.rules[award.reason] === undefined) {
      return { ok: false, reason: 'MISSING_EXPERIENCE_RULE', awardIndex };
    }
  }

  const groupedAwards = new Map<ExperienceReason, GroupedAward>();
  for (const award of input.awards) {
    const groupedAward = groupedAwards.get(award.reason);
    if (groupedAward === undefined) {
      groupedAwards.set(award.reason, {
        quantity: award.quantity,
        evidenceIds: [...award.evidenceIds],
      });
      continue;
    }

    groupedAward.quantity += award.quantity;
    groupedAward.evidenceIds.push(...award.evidenceIds);
  }

  const details: ExperienceAwardDetail[] = [];
  for (const [reason, groupedAward] of groupedAwards) {
    const rule = input.rules[reason];
    if (rule === undefined) {
      throw new Error(`missing experience rule for ${reason}`);
    }

    details.push({
      reason,
      quantity: groupedAward.quantity,
      awardedExperience: Math.min(
        groupedAward.quantity * rule.experiencePerOccurrence,
        rule.settlementCap,
      ),
      evidenceIds: groupedAward.evidenceIds,
    });
  }

  return {
    ok: true,
    totalExperience: details.reduce((total, detail) => total + detail.awardedExperience, 0),
    details,
  };
}
