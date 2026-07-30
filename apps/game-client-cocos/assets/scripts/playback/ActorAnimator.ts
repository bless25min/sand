import { Component, Tween, Vec3, tween } from 'cc';
import type { Node } from 'cc';

export interface ActorPose {
  node: Node;
  origin: Vec3;
  scale: Vec3;
  angle: number;
}

export class ActorAnimator extends Component {
  async windUp(
    actor: Node | undefined,
    target: Node | undefined,
    tier: number,
    durationMs: number,
    signal: AbortSignal,
    enabled: boolean,
  ): Promise<ActorPose | undefined> {
    if (!actor || !target) return undefined;
    const pose = {
      node: actor,
      origin: actor.position.clone(),
      scale: actor.scale.clone(),
      angle: actor.angle,
    };
    if (!enabled || durationMs === 0) return pose;
    const direction = target.position.clone().subtract(pose.origin).normalize();
    const windUp = pose.origin.clone().subtract(direction.multiplyScalar(10 + tier * 2));
    await this.run(
      actor,
      signal,
      (finish) =>
        tween(actor)
          .to(durationMs / 1000, {
            position: windUp,
            scale: new Vec3(pose.scale.x * 0.92, pose.scale.y * 1.08, pose.scale.z),
            angle: pose.angle + (tier % 2 === 0 ? -3 : 3),
          })
          .call(finish)
          .start(),
      () => this.restore(pose),
    );
    return pose;
  }

  async strike(
    pose: ActorPose | undefined,
    target: Node | undefined,
    tier: number,
    durationMs: number,
    signal: AbortSignal,
    enabled: boolean,
  ): Promise<void> {
    if (!pose || !target || !enabled) return;
    if (durationMs === 0) return;
    const direction = target.position.clone().subtract(pose.origin).normalize();
    const distance = Math.min(
      154,
      Math.max(62 + tier * 8, Vec3.distance(pose.origin, target.position) * 0.46),
    );
    const strike = pose.origin.clone().add(direction.multiplyScalar(distance));
    await this.run(
      pose.node,
      signal,
      (finish) =>
        tween(pose.node)
          .to(durationMs / 1000, {
            position: strike,
            scale: new Vec3(pose.scale.x * 1.13, pose.scale.y * 0.96, pose.scale.z),
            angle: pose.angle,
          })
          .call(finish)
          .start(),
      () => this.restore(pose),
    );
  }

  async react(
    target: Node | undefined,
    actor: Node | undefined,
    tier: number,
    durationMs: number,
    hitStopMs: number,
    signal: AbortSignal,
    defeated: boolean,
  ): Promise<void> {
    if (!target || durationMs === 0) return;
    const origin = target.position.clone();
    const scale = target.scale.clone();
    const angle = target.angle;
    const direction = actor
      ? target.position.clone().subtract(actor.position).normalize()
      : new Vec3(1, 0);
    const recoil = origin.clone().add(direction.multiplyScalar(10 + tier * 5));
    await this.run(
      target,
      signal,
      (finish) =>
        tween(target)
          .to(Math.max(0.025, durationMs * 0.32) / 1000, {
            position: recoil,
            scale: new Vec3(scale.x * 1.15, scale.y * 0.78, scale.z),
            angle: angle + (direction.x >= 0 ? -1 : 1) * (5 + tier * 2),
          })
          .delay(hitStopMs / 1000)
          .to(Math.max(0.04, durationMs * 0.68) / 1000, {
            position: defeated ? origin.clone().add(new Vec3(0, -12 - tier * 3)) : origin,
            scale: defeated ? new Vec3(scale.x * 1.12, scale.y * 0.62, scale.z) : scale,
            angle: defeated ? angle + (direction.x >= 0 ? -22 : 22) : angle,
          })
          .call(finish)
          .start(),
      () => {
        target.setPosition(origin);
        target.setScale(scale);
        target.angle = angle;
      },
    );
  }

  async recover(
    pose: ActorPose | undefined,
    durationMs: number,
    signal: AbortSignal,
  ): Promise<void> {
    if (!pose) return;
    if (durationMs === 0) {
      this.restore(pose);
      return;
    }
    await this.run(
      pose.node,
      signal,
      (finish) =>
        tween(pose.node)
          .to(durationMs / 1000, {
            position: pose.origin,
            scale: pose.scale,
            angle: pose.angle,
          })
          .call(finish)
          .start(),
      () => this.restore(pose),
    );
  }

  private run(
    node: Node,
    signal: AbortSignal,
    start: (finish: () => void) => void,
    onAbort: () => void,
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      let settled = false;
      const finish = (): void => {
        if (settled) return;
        settled = true;
        signal.removeEventListener('abort', abort);
        resolve();
      };
      const abort = (): void => {
        Tween.stopAllByTarget(node);
        onAbort();
        finish();
      };
      signal.addEventListener('abort', abort, { once: true });
      start(finish);
    });
  }

  private restore(pose: ActorPose): void {
    pose.node.setPosition(pose.origin);
    pose.node.setScale(pose.scale);
    pose.node.angle = pose.angle;
  }
}
