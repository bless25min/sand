import { Component, Tween, Vec3, tween } from 'cc';
import type { Node } from 'cc';

export class ActorAnimator extends Component {
  async play(
    actor: Node | undefined,
    target: Node | undefined,
    tier: number,
    signal: AbortSignal,
    enabled: boolean,
  ): Promise<void> {
    if (!enabled) return;
    if (!actor || !target) return;
    const origin = actor.position.clone();
    const originScale = actor.scale.clone();
    const direction = target.position.clone().subtract(origin).normalize();
    const distance = Math.min(
      140,
      Math.max(58 + tier * 6, Vec3.distance(origin, target.position) * 0.42),
    );
    const strike = origin.clone().add(direction.multiplyScalar(distance));
    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = (): void => {
        if (settled) return;
        settled = true;
        signal.removeEventListener('abort', abort);
        actor.setPosition(origin);
        actor.setScale(originScale);
        resolve();
      };
      const abort = (): void => {
        Tween.stopAllByTarget(actor);
        finish();
      };
      signal.addEventListener('abort', abort, { once: true });
      tween(actor)
        .to(0.06 + tier * 0.008, {
          position: strike,
          scale: new Vec3(originScale.x * 1.12, originScale.y * 1.12, originScale.z),
        })
        .to(0.1, { position: origin, scale: originScale })
        .call(finish)
        .start();
    });
  }
}
