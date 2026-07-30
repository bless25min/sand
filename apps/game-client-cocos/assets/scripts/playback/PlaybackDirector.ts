import { Component } from 'cc';
import type { Node } from 'cc';

import {
  compilePresentation,
  createCinematicBeatPlan,
  playPresentationSequence,
  resolveRouteVisual,
} from '../../runtime/expedition-runtime.mjs';
import type { RuntimeEvent, RuntimeGuildState } from '../runtime/RuntimeContracts';
import { ActorAnimator, type ActorPose } from './ActorAnimator';
import { AudioDirector } from './AudioDirector';
import { CameraDirector } from './CameraDirector';
import { DamageNumberPool } from './DamageNumberPool';
import { VfxDirector } from './VfxDirector';

interface PresentationBeat {
  id: string;
  kind: string;
  eventKind: string;
  sourceEventIds: readonly number[];
  tier: number;
  durationMs: number;
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

interface PresentationSequence {
  beats: readonly PresentationBeat[];
  reducedMotion: boolean;
}

interface CinematicPlan {
  phases: readonly {
    kind: 'anticipation' | 'travel' | 'impact' | 'reaction' | 'recovery';
    durationMs: number;
  }[];
  hitStopMs: number;
  finisher: boolean;
}

export class PlaybackDirector extends Component {
  private actorAnimator?: ActorAnimator;
  private cameraDirector?: CameraDirector;
  private vfxDirector?: VfxDirector;
  private audioDirector?: AudioDirector;
  private numbers?: DamageNumberPool;
  private abortController?: AbortController;
  private reducedMotion = false;
  private hapticsEnabled = true;

  initialize(preferences: RuntimeGuildState['preferences']): void {
    this.reducedMotion = preferences.motion === 'reduced';
    this.hapticsEnabled = preferences.hapticsEnabled;
    this.actorAnimator = this.node.addComponent(ActorAnimator);
    this.cameraDirector = this.node.addComponent(CameraDirector);
    this.vfxDirector = this.node.addComponent(VfxDirector);
    this.audioDirector = this.node.addComponent(AudioDirector);
    this.audioDirector.initialize(preferences.musicEnabled, preferences.masterVolume);
    this.numbers = this.node.addComponent(DamageNumberPool);
  }

  async play(
    events: readonly RuntimeEvent[],
    unitNodes: ReadonlyMap<string, Node>,
    stage: Node,
    baseTier: number,
    onEventVisible?: (visibleCount: number) => void,
  ): Promise<void> {
    this.cancel();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    const sequence = compilePresentation(events, {
      reducedMotion: this.reducedMotion,
      baseTier,
    }) as PresentationSequence;
    let visibleCount = 0;
    const heldPoses = new Map<string, ActorPose>();
    const markVisible = (): void => {
      visibleCount += 1;
      onEventVisible?.(visibleCount);
    };
    const result = await playPresentationSequence(
      sequence,
      {
        play: async (beat: PresentationBeat, beatSignal: AbortSignal) => {
          const actor = beat.actorId ? unitNodes.get(beat.actorId) : undefined;
          const target = beat.targetId ? unitNodes.get(beat.targetId) : undefined;
          const treatment = resolveRouteVisual(beat.route, beat.cue);
          const plan = createCinematicBeatPlan({
            kind: beat.kind,
            tier: beat.tier,
            route: beat.route,
            cue: beat.cue,
            reducedMotion: this.reducedMotion,
          }) as CinematicPlan;
          this.trace(beat, plan);
          const anticipationMs = this.phase(plan, 'anticipation');
          const travelMs = this.phase(plan, 'travel');
          const reactionMs = this.phase(plan, 'reaction');
          const recoveryMs = this.phase(plan, 'recovery');

          if (beat.kind === 'cast') {
            const pose = await this.actorAnimator!.windUp(
              actor,
              target,
              beat.tier,
              anticipationMs,
              beatSignal,
              true,
            );
            await this.vfxDirector!.charge(
              actor,
              beat.tier,
              beat.element,
              anticipationMs,
              beatSignal,
            );
            if (pose && beat.actorId) heldPoses.set(beat.actorId, pose);
            markVisible();
            return;
          }

          const damaging =
            beat.kind === 'impact' ||
            beat.kind === 'enemy' ||
            beat.kind === 'support' ||
            beat.kind === 'defeat' ||
            beat.kind === 'finisher';
          let pose = beat.actorId ? heldPoses.get(beat.actorId) : undefined;
          if (damaging && !pose) {
            pose = await this.actorAnimator!.windUp(
              actor,
              target,
              beat.tier,
              Math.round(anticipationMs * 0.72),
              beatSignal,
              treatment.actorMotion,
            );
          }
          if (pose && beat.actorId) heldPoses.delete(beat.actorId);

          if (damaging) {
            await this.vfxDirector!.travel(
              stage,
              actor,
              target,
              beat.tier,
              beat.element,
              treatment,
              travelMs,
              beatSignal,
            );
            await this.actorAnimator!.strike(
              pose,
              target,
              beat.tier,
              this.phase(plan, 'impact'),
              beatSignal,
              treatment.actorMotion,
            );
          }

          markVisible();
          if (beat.number) {
            this.numbers!.show(target, beat.number.value, beat.number.kind, beat.tier);
          }
          const impactful = damaging || beat.kind === 'relay' || beat.tier >= 5;
          if (impactful) {
            this.audioDirector!.playImpact(beat.tier, plan.finisher);
            this.pulse(beat.tier, plan.finisher);
          }
          await Promise.all([
            impactful
              ? this.cameraDirector!.punch(stage, beat.cue, plan.finisher, beatSignal)
              : Promise.resolve(),
            this.vfxDirector!.burst(
              target ?? actor,
              beat.tier,
              beat.element,
              treatment,
              reactionMs,
              beatSignal,
            ),
            damaging
              ? this.actorAnimator!.react(
                  target,
                  actor,
                  beat.tier,
                  reactionMs,
                  plan.hitStopMs,
                  beatSignal,
                  beat.kind === 'defeat' || beat.eventKind === 'unit_defeated',
                )
              : Promise.resolve(),
          ]);
          await this.actorAnimator!.recover(pose, recoveryMs, beatSignal);
        },
      },
      { timeoutMs: 1_500, signal },
    );
    await Promise.all(
      Array.from(heldPoses.values()).map((pose) =>
        this.actorAnimator!.recover(pose, this.reducedMotion ? 0 : 80, signal),
      ),
    );
    if (result.timedOutBeatIds.length > 0) {
      (
        globalThis as typeof globalThis & {
          __EXPEDITION_TIMED_OUT_BEATS__?: readonly string[];
        }
      ).__EXPEDITION_TIMED_OUT_BEATS__ = result.timedOutBeatIds;
    }
  }

  cancel(): void {
    this.abortController?.abort();
    this.abortController = undefined;
  }

  private phase(plan: CinematicPlan, kind: CinematicPlan['phases'][number]['kind']): number {
    return plan.phases.find((phase) => phase.kind === kind)?.durationMs ?? 0;
  }

  private pulse(tier: number, finisher: boolean): void {
    if (!this.hapticsEnabled) return;
    const host = globalThis as typeof globalThis & {
      navigator?: { vibrate?: (pattern: number | readonly number[]) => boolean };
    };
    const duration = finisher ? [24, 30, 48] : Math.min(12 + tier * 4, 32);
    host.navigator?.vibrate?.(duration);
  }

  private trace(beat: PresentationBeat, plan: CinematicPlan): void {
    const host = globalThis as typeof globalThis & {
      __EXPEDITION_PLAYBACK_TRACE__?: {
        maxTier: number;
        beatKinds: string[];
        phases: string[];
      };
    };
    const previous = host.__EXPEDITION_PLAYBACK_TRACE__;
    host.__EXPEDITION_PLAYBACK_TRACE__ = {
      maxTier: Math.max(previous?.maxTier ?? 0, beat.tier),
      beatKinds: [...(previous?.beatKinds ?? []), beat.kind],
      phases: [
        ...(previous?.phases ?? []),
        ...plan.phases.filter(({ durationMs }) => durationMs > 0).map(({ kind }) => kind),
      ],
    };
  }
}
