import { Color, Component, Graphics, Node, Tween, UIOpacity, UITransform, Vec3, tween } from 'cc';

interface CameraCue {
  shakePx: number;
  hitStopMs: number;
  cameraZoom: number;
  flashAlpha: number;
}

export class CameraDirector extends Component {
  async punch(stage: Node, cue: CameraCue, finisher: boolean, signal: AbortSignal): Promise<void> {
    const origin = stage.position.clone();
    const scale = stage.scale.clone();
    const zoom = cue.cameraZoom + (finisher ? 0.045 : 0);
    const shake = cue.shakePx + (finisher ? 8 : 0);
    const direction = finisher ? 1 : -1;
    const flash = this.createFlash(stage, cue.flashAlpha + (finisher ? 0.12 : 0));
    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = (): void => {
        if (settled) return;
        settled = true;
        signal.removeEventListener('abort', abort);
        stage.setPosition(origin);
        stage.setScale(scale);
        Tween.stopAllByTarget(flash);
        if (flash.isValid) flash.destroy();
        resolve();
      };
      const abort = (): void => {
        Tween.stopAllByTarget(stage);
        finish();
      };
      signal.addEventListener('abort', abort, { once: true });
      tween(stage)
        .to(0.022, {
          position: origin.clone().add(new Vec3(direction * shake, shake * 0.42)),
          scale: new Vec3(scale.x * zoom, scale.y * zoom, scale.z),
        })
        .to(0.024, {
          position: origin.clone().add(new Vec3(-direction * shake * 0.62, -shake * 0.28)),
        })
        .delay(cue.hitStopMs / 1000)
        .to(0.085, { position: origin, scale })
        .call(finish)
        .start();
      const opacity = flash.getComponent(UIOpacity)!;
      tween(opacity).to(0.025, { opacity: 255 }).to(0.095, { opacity: 0 }).start();
    });
  }

  private createFlash(stage: Node, alpha: number): Node {
    const flash = new Node('ImpactFlash');
    stage.addChild(flash);
    const transform = stage.getComponent(UITransform);
    const width = transform?.contentSize.width ?? 720;
    const height = transform?.contentSize.height ?? 720;
    const graphics = flash.addComponent(Graphics);
    graphics.fillColor = new Color(255, 244, 206, 255);
    graphics.rect(-width / 2, -height / 2, width, height);
    graphics.fill();
    const opacity = flash.addComponent(UIOpacity);
    opacity.opacity = Math.round(Math.max(0, Math.min(1, alpha)) * 255);
    return flash;
  }
}
