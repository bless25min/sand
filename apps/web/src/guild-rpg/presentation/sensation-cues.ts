import type { ComboEvent, QuestRewards, SpectacleCueId } from '@expedition/shared-types';

import { cueForComboEvent, rewardSpectacleCues } from './spectacle-registry';

export type SensationCueId = SpectacleCueId;

export interface CueProjectionInput {
  events: readonly ComboEvent[];
  lootRevealed?: boolean;
  rewardCues?: readonly SpectacleCueId[];
  ruleOnline?: boolean;
}

interface SensationCueSnapshot {
  sessionId: string;
  screen: 'guild' | 'battle' | 'playback' | 'rewards';
  visibleEvents: readonly ComboEvent[];
  activatedRuleIds: readonly string[];
  rewards?: QuestRewards | undefined;
}

export interface SensationCueTracker {
  next(snapshot: SensationCueSnapshot): readonly SensationCueId[];
}

function eventCues(event: ComboEvent): readonly SensationCueId[] {
  const cue = cueForComboEvent(event);
  if (!cue) return [];
  return event.kind === 'unit_defeated' ? ['break', cue] : [cue];
}

export function projectSensationCues(input: CueProjectionInput): readonly SensationCueId[] {
  const cues: SensationCueId[] = [];
  const seen = new Set<SensationCueId>();
  const append = (cue: SensationCueId) => {
    if (seen.has(cue)) return;
    seen.add(cue);
    cues.push(cue);
  };

  for (const event of input.events) {
    for (const cue of eventCues(event)) append(cue);
  }
  if (input.lootRevealed) append('loot');
  for (const cue of input.rewardCues ?? []) append(cue);
  if (input.ruleOnline) append('rule-online');
  return cues;
}

export function createSensationCueTracker(): SensationCueTracker {
  let sessionId: string | undefined;
  let previousScreen: SensationCueSnapshot['screen'] | undefined;
  let seenEventIds = new Set<number>();
  let seenRuleIds = new Set<string>();

  return {
    next(snapshot) {
      if (snapshot.sessionId !== sessionId) {
        sessionId = snapshot.sessionId;
        previousScreen = undefined;
        seenEventIds = new Set();
        seenRuleIds = new Set();
      }
      const events = snapshot.visibleEvents.filter((event) => {
        if (seenEventIds.has(event.id)) return false;
        seenEventIds.add(event.id);
        return true;
      });
      const ruleOnline = snapshot.activatedRuleIds.some((ruleId) => {
        if (seenRuleIds.has(ruleId)) return false;
        seenRuleIds.add(ruleId);
        return true;
      });
      const rewardsRevealed = snapshot.screen === 'rewards' && previousScreen !== 'rewards';
      const rewardCues = rewardsRevealed
        ? snapshot.rewards
          ? rewardSpectacleCues(snapshot.rewards)
          : (['loot'] as const)
        : [];
      previousScreen = snapshot.screen;
      return projectSensationCues({ events, rewardCues, ruleOnline });
    },
  };
}
