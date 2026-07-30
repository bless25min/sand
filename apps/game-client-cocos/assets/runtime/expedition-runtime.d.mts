import type {
  RuntimeActionInput,
  RuntimeBattle,
  RuntimeEvent,
  RuntimePreview,
  RuntimeProfile,
  RuntimeRewards,
} from '../scripts/runtime/RuntimeContracts';

export function createProfile(): RuntimeProfile;
export function startQuest(profile: RuntimeProfile, questId: string): RuntimeBattle;
export function chooseNextHero(battle: RuntimeBattle, actorId: string): RuntimeBattle;
export function previewSkill(input: RuntimeActionInput): RuntimePreview;
export function resolveAction(input: RuntimeActionInput): {
  battle: RuntimeBattle;
  events: readonly RuntimeEvent[];
};
export function calculateRewards(
  profile: RuntimeProfile,
  battle: RuntimeBattle,
): RuntimeRewards | undefined;

export function resolveBattleLayout(viewport: { width: number; height: number }): {
  mode: 'mobile-portrait' | 'desktop-landscape';
  header: { height: number };
  battlefield: { height: number };
  commandLens: { height: number };
  skillDock: { height: number; columns: 3 | 6; rows: 1 | 2 };
};

export function resolveDesignResolution(viewport: { width: number; height: number }): {
  width: number;
  height: number;
};

export function resolveBattleFormation(input: {
  width: number;
  height: number;
  heroCount: number;
  enemyCount: number;
}): {
  compact: boolean;
  tapWidth: number;
  tapHeight: number;
  heroes: readonly { x: number; y: number }[];
  enemies: readonly { x: number; y: number }[];
};

export function formatTriggerCue(
  triggerId: string,
  ready: boolean,
): { state: 'ready' | 'blocked'; text: string };

export function formatComboCue(
  steps: readonly {
    triggerId: string;
    readiness: 'ready' | 'pending-impact' | 'not-ready';
  }[],
): { state: 'ready' | 'partial' | 'blocked'; text: string };

export interface RuntimePresentationBeat {
  id: string;
  kind: string;
  durationMs: number;
  tier: number;
  route: 'none' | 'direct' | 'area' | 'bounce' | 'echo-self' | 'relay';
  cue: {
    particles: number;
    rings: number;
    afterimages: number;
    shakePx: number;
    hitStopMs: number;
    cameraZoom: number;
    flashAlpha: number;
  };
  actorId?: string;
  targetId?: string;
  element?: string;
  number?: { kind: string; value: number };
}

export interface RuntimePresentationSequence {
  beats: readonly RuntimePresentationBeat[];
  reducedMotion: boolean;
}

export function compilePresentation(
  events: readonly RuntimeEvent[],
  options: { reducedMotion: boolean; baseTier?: number },
): RuntimePresentationSequence;

export function playPresentationSequence(
  sequence: RuntimePresentationSequence,
  adapter: { play(beat: RuntimePresentationBeat, signal: AbortSignal): Promise<void> },
  options: { timeoutMs: number },
): Promise<{
  completed: boolean;
  aborted: boolean;
  nextIndex: number;
  timedOutBeatIds: readonly string[];
}>;

export function resolveRouteVisual(
  route: RuntimePresentationBeat['route'],
  cue: RuntimePresentationBeat['cue'],
): {
  signature: 'strike' | 'blast' | 'ricochet' | 'echo' | 'handoff' | 'aura';
  actorMotion: boolean;
  pulses: number;
  particles: number;
  rings: number;
  afterimages: number;
};

export function createLootLayout(input: {
  materials: readonly { id: string; name: string; quantity: number }[];
  entries: readonly {
    id: string;
    kind: 'equipment' | 'skill';
    name: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    summary: string;
    detailLines: readonly string[];
  }[];
}): {
  entries: readonly {
    id: string;
    kind: 'equipment' | 'skill';
    name: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    summary: string;
    detailLines: readonly string[];
  }[];
};
