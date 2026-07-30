import { Component } from 'cc';
import type { Node } from 'cc';

import {
  compilePresentation,
  playPresentationSequence,
  resolveRouteVisual,
} from '../../runtime/expedition-runtime.mjs';
import type { RuntimeEvent, RuntimeGuildState } from '../runtime/RuntimeContracts';
import { ActorAnimator } from './ActorAnimator';
import { AudioDirector } from './AudioDirector';
import { CameraDirector } from './CameraDirector';
import { DamageNumberPool } from './DamageNumberPool';
import { VfxDirector } from './VfxDirector';

interface PresentationBeat {
  id: string;
  kind: string;
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
  ): Promise<void> {
    this.cancel();
    this.abortController = new AbortController();
    const sequence = compilePresentation(events, {
      reducedMotion: this.reducedMotion,
      baseTier,
    }) as PresentationSequence;
    const result = await playPresentationSequence(
      sequence,
      {
        play: async (beat: PresentationBeat, signal: AbortSignal) => {
          const actor = beat.actorId ? unitNodes.get(beat.actorId) : undefined;
          const target = beat.targetId ? unitNodes.get(beat.targetId) : undefined;
          const finisher = beat.kind === 'finisher' || beat.tier === 6;
          const treatment = resolveRouteVisual(beat.route, beat.cue);
          if (beat.number) {
            this.numbers!.show(target, beat.number.value, beat.number.kind, beat.tier);
          }
          this.audioDirector!.playImpact(beat.tier, finisher);
          this.pulse(beat.tier, finisher);
          await Promise.all([
            this.actorAnimator!.play(actor, target, beat.tier, signal, treatment.actorMotion),
            this.cameraDirector!.punch(stage, beat.tier, finisher, signal),
            this.vfxDirector!.burst(target, beat.tier, beat.element, treatment, signal),
          ]);
        },
      },
      { timeoutMs: 1_200, signal: this.abortController.signal },
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

  private pulse(tier: number, finisher: boolean): void {
    if (!this.hapticsEnabled) return;
    const host = globalThis as typeof globalThis & {
      navigator?: { vibrate?: (pattern: number | readonly number[]) => boolean };
    };
    const duration = finisher ? [24, 30, 48] : Math.min(12 + tier * 4, 32);
    host.navigator?.vibrate?.(duration);
  }
}
