import type { BattleEventKind, GuildBattleEvent, GuildElement } from '@expedition/shared-types';
import type { GuildCombatVisualEvent } from '@expedition/pixi-renderer';

type VisualEventPhase = 'windup' | 'travel' | 'impact' | 'aftermath' | 'finisher';
type VisualEventRoute = 'direct' | 'bounce' | 'echo' | 'area' | 'none';
type VisualEventCamera = 'none' | 'track' | 'punch' | 'shake' | 'finisher';
type VisualEventPolarity = 'damage' | 'support' | 'neutral';
type VisualStatus = 'burn' | 'poison' | 'tide' | 'weaken' | 'strengthen';

export type VisualEvent = GuildCombatVisualEvent;

interface VisualRule {
  phase: VisualEventPhase;
  headline: string;
  polarity: VisualEventPolarity;
  route: VisualEventRoute;
  camera: VisualEventCamera;
  durationMs: number;
}

const RULES: Readonly<Record<BattleEventKind, VisualRule>> = {
  battle_started: {
    phase: 'windup',
    headline: '交戰開始',
    polarity: 'neutral',
    route: 'none',
    camera: 'track',
    durationMs: 90,
  },
  skill_cast: {
    phase: 'windup',
    headline: '技能起手',
    polarity: 'neutral',
    route: 'direct',
    camera: 'track',
    durationMs: 130,
  },
  damage: {
    phase: 'impact',
    headline: '重擊',
    polarity: 'damage',
    route: 'direct',
    camera: 'punch',
    durationMs: 170,
  },
  enemy_attack: {
    phase: 'impact',
    headline: '敵軍反擊',
    polarity: 'damage',
    route: 'direct',
    camera: 'shake',
    durationMs: 320,
  },
  dodge: {
    phase: 'aftermath',
    headline: '高速閃避',
    polarity: 'support',
    route: 'direct',
    camera: 'track',
    durationMs: 300,
  },
  healing: {
    phase: 'impact',
    headline: '治療回復',
    polarity: 'support',
    route: 'area',
    camera: 'none',
    durationMs: 150,
  },
  guard: {
    phase: 'impact',
    headline: '格擋',
    polarity: 'support',
    route: 'none',
    camera: 'punch',
    durationMs: 280,
  },
  status_applied: {
    phase: 'aftermath',
    headline: '狀態疊層',
    polarity: 'neutral',
    route: 'area',
    camera: 'none',
    durationMs: 120,
  },
  reaction: {
    phase: 'impact',
    headline: '元素反應',
    polarity: 'damage',
    route: 'area',
    camera: 'shake',
    durationMs: 210,
  },
  weaken: {
    phase: 'aftermath',
    headline: '防線熔解',
    polarity: 'damage',
    route: 'area',
    camera: 'none',
    durationMs: 120,
  },
  strengthen: {
    phase: 'aftermath',
    headline: '強化',
    polarity: 'support',
    route: 'area',
    camera: 'none',
    durationMs: 120,
  },
  triggered: {
    phase: 'windup',
    headline: '條件成立',
    polarity: 'neutral',
    route: 'none',
    camera: 'track',
    durationMs: 110,
  },
  bounce: {
    phase: 'travel',
    headline: '彈射折返',
    polarity: 'damage',
    route: 'bounce',
    camera: 'track',
    durationMs: 170,
  },
  echo: {
    phase: 'travel',
    headline: '迴響追擊',
    polarity: 'damage',
    route: 'echo',
    camera: 'track',
    durationMs: 160,
  },
  relay: {
    phase: 'aftermath',
    headline: '接力升壓',
    polarity: 'support',
    route: 'area',
    camera: 'shake',
    durationMs: 150,
  },
  core_triggered: {
    phase: 'windup',
    headline: '裝備核心',
    polarity: 'support',
    route: 'area',
    camera: 'track',
    durationMs: 130,
  },
  passive: {
    phase: 'aftermath',
    headline: '角色特性',
    polarity: 'support',
    route: 'area',
    camera: 'none',
    durationMs: 120,
  },
  boss_phase: {
    phase: 'finisher',
    headline: '首領階段',
    polarity: 'damage',
    route: 'area',
    camera: 'shake',
    durationMs: 320,
  },
  finisher: {
    phase: 'finisher',
    headline: '全軍終結',
    polarity: 'damage',
    route: 'area',
    camera: 'finisher',
    durationMs: 520,
  },
  overkill: {
    phase: 'finisher',
    headline: '過量殲滅',
    polarity: 'damage',
    route: 'area',
    camera: 'shake',
    durationMs: 220,
  },
  infinite_engine: {
    phase: 'finisher',
    headline: '無限引擎',
    polarity: 'damage',
    route: 'area',
    camera: 'finisher',
    durationMs: 440,
  },
  unit_defeated: {
    phase: 'aftermath',
    headline: '擊破',
    polarity: 'damage',
    route: 'none',
    camera: 'shake',
    durationMs: 190,
  },
  victory: {
    phase: 'finisher',
    headline: '遠征勝利',
    polarity: 'support',
    route: 'area',
    camera: 'finisher',
    durationMs: 480,
  },
  defeat: {
    phase: 'finisher',
    headline: '遠征失敗',
    polarity: 'damage',
    route: 'none',
    camera: 'shake',
    durationMs: 300,
  },
};

const statusFor = (event: GuildBattleEvent): VisualStatus | undefined => {
  if (event.kind === 'weaken') return 'weaken';
  if (event.kind === 'strengthen') return 'strengthen';
  if (event.kind !== 'status_applied') return undefined;
  if (event.element === 'fire') return 'burn';
  if (event.element === 'grass') return 'poison';
  if (event.element === 'water') return 'tide';
  return undefined;
};

const statusHeadline = (status: VisualStatus | undefined, fallback: string) =>
  status
    ? {
        burn: '燃燒疊層',
        poison: '毒素疊層',
        tide: '潮汐蓄能',
        weaken: '防線熔解',
        strengthen: '戰力強化',
      }[status]
    : fallback;

const castHeadline = (element: GuildElement | undefined) =>
  element
    ? {
        fire: '熔火起手',
        grass: '瘴霧起手',
        water: '潮汐起手',
      }[element]
    : '技能起手';

const signedNumber = (event: GuildBattleEvent, polarity: VisualEventPolarity) => {
  if (event.amount === undefined || event.amount === 0) return undefined;
  if (event.kind === 'overkill') return Math.abs(event.amount);
  if (polarity === 'damage' && event.kind !== 'status_applied') return -Math.abs(event.amount);
  return Math.abs(event.amount);
};

export function projectVisualEvents(
  events: readonly GuildBattleEvent[],
  relay: number,
  reducedMotion: boolean,
): readonly VisualEvent[] {
  const normalizedRelay = Math.max(1, Math.min(6, Math.trunc(relay)));
  return events.map((event) => {
    const rule = RULES[event.kind];
    const status = statusFor(event);
    const headline =
      event.kind === 'skill_cast'
        ? castHeadline(event.element)
        : status
          ? statusHeadline(status, rule.headline)
          : rule.headline;
    const eventRelay =
      event.causalDepth !== undefined
        ? Math.max(1, Math.min(6, Math.trunc(event.causalDepth)))
        : event.kind === 'relay' && event.amount !== undefined
          ? Math.max(1, Math.min(6, Math.trunc(event.amount)))
          : normalizedRelay;
    const intensity =
      rule.phase === 'finisher' && eventRelay === 6 ? 100 : Math.min(94, 14 + eventRelay * 12);
    const number = signedNumber(event, rule.polarity);
    return {
      id: `visual:${event.id}:${event.kind}`,
      sourceEventId: event.id,
      eventKind: event.kind,
      phase: rule.phase,
      headline,
      detail: event.message,
      relay: eventRelay,
      ...(event.causalDepth !== undefined ? { causalDepth: eventRelay } : {}),
      intensity,
      durationMs: reducedMotion ? 0 : rule.durationMs,
      polarity: rule.polarity,
      route: rule.route,
      camera: rule.camera,
      ...(event.actorId ? { actorId: event.actorId } : {}),
      ...(event.targetId ? { targetId: event.targetId } : {}),
      ...(number !== undefined ? { number } : {}),
      ...(event.element ? { element: event.element } : {}),
      ...(event.specializationId ? { specializationId: event.specializationId } : {}),
      ...(event.triggerId ? { triggerId: event.triggerId } : {}),
      ...(status ? { status } : {}),
    };
  });
}
