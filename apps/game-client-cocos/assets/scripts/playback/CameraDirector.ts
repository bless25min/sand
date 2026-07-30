import { Component, Tween, Vec3, tween } from 'cc';
import type { Node } from 'cc';

export class CameraDirector extends Component {
  async punch(stage: Node, tier: number, finisher: boolean, signal: AbortSignal): Promise<void> {
    const origin = stage.position.clone();
    const scale = stage.scale.clone();
    const zoom = 1 + tier * tier * 0.009 + (finisher ? 0.09 : 0);
    const offset =
      tier <= 1 ? new Vec3(2, 0) : new Vec3((tier % 2 ? 1 : -1) * tier * 2.2, tier * 1.1);
    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = (): void => {
        if (settled) return;
        settled = true;
        signal.removeEventListener('abort', abort);
        stage.setPosition(origin);
        stage.setScale(scale);
        resolve();
      };
      const abort = (): void => {
        Tween.stopAllByTarget(stage);
        finish();
      };
      signal.addEventListener('abort', abort, { once: true });
      tween(stage)
        .to(0.04, {
          position: origin.clone().add(offset),
          scale: new Vec3(scale.x * zoom, scale.y * zoom, scale.z),
        })
        .to(0.09 + tier * 0.01, { position: origin, scale })
        .call(finish)
        .start();
    });
  }
}
