import { Color, Component, Graphics, Node, Tween, UIOpacity, Vec3, tween } from 'cc';

import { COLORS, addText, createUiNode } from '../ui/UiFactory';

const ELEMENT_COLORS = {
  fire: new Color(255, 91, 45, 255),
  grass: new Color(94, 227, 132, 255),
  water: new Color(74, 190, 255, 255),
  neutral: new Color(255, 215, 116, 255),
};

interface RouteTreatment {
  signature: 'strike' | 'blast' | 'ricochet' | 'echo' | 'handoff' | 'aura';
  actorMotion: boolean;
  pulses: number;
  particles: number;
  rings: number;
  afterimages: number;
}

export class VfxDirector extends Component {
  async burst(
    target: Node | undefined,
    tier: number,
    element: string | undefined,
    treatment: RouteTreatment,
    signal: AbortSignal,
  ): Promise<void> {
    if (!target) return;
    const root = new Node(`${treatment.signature}-Tier${tier}`);
    target.addChild(root);
    const color =
      element === 'fire' || element === 'grass' || element === 'water'
        ? ELEMENT_COLORS[element]
        : ELEMENT_COLORS.neutral;
    this.addShockwave(root, color, tier);
    this.addImpactCore(root, color, tier);
    this.addRouteMotif(root, color, tier, treatment);
    if (treatment.signature === 'handoff' || tier > 1) this.addRelayCue(root, tier);
    const count = Math.min(120, treatment.particles);
    for (let index = 0; index < count; index += 1) {
      const mote = new Node(`Mote${index}`);
      root.addChild(mote);
      const graphics = mote.addComponent(Graphics);
      graphics.fillColor = color;
      graphics.circle(0, 0, 4 + (index % 4) + tier * 0.35);
      graphics.fill();
      const angle = (index / count) * Math.PI * 2;
      const radius = 48 + tier * 13 + (index % 4) * 7;
      tween(mote)
        .to(0.16 + tier * 0.018, {
          position: new Vec3(Math.cos(angle) * radius, Math.sin(angle) * radius),
          scale: Vec3.ZERO,
        })
        .start();
    }
    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = (): void => {
        if (settled) return;
        settled = true;
        signal.removeEventListener('abort', abort);
        this.stopTree(root);
        if (root.isValid) root.destroy();
        resolve();
      };
      const abort = (): void => finish();
      signal.addEventListener('abort', abort, { once: true });
      tween(root)
        .delay(0.22 + tier * 0.02)
        .call(finish)
        .start();
    });
  }

  private addRouteMotif(root: Node, color: Color, tier: number, treatment: RouteTreatment): void {
    if (treatment.signature === 'ricochet') {
      const path = new Node('RicochetPath');
      root.addChild(path);
      const graphics = path.addComponent(Graphics);
      graphics.strokeColor = color;
      graphics.lineWidth = 4 + tier * 0.5;
      graphics.moveTo(-70, -32);
      graphics.lineTo(0, 56);
      graphics.lineTo(70, -12);
      graphics.stroke();
      for (const [index, point] of [
        new Vec3(-70, -32),
        new Vec3(0, 56),
        new Vec3(70, -12),
      ].entries()) {
        const orb = new Node(`Bounce${index + 1}`);
        path.addChild(orb);
        orb.setPosition(point);
        const orbGraphic = orb.addComponent(Graphics);
        orbGraphic.fillColor = color;
        orbGraphic.circle(0, 0, 8 + tier);
        orbGraphic.fill();
        orb.setScale(0.35, 0.35);
        tween(orb)
          .delay(index * 0.035)
          .to(0.1, { scale: Vec3.ONE })
          .start();
      }
      return;
    }
    if (treatment.signature === 'echo') {
      for (let index = 0; index < treatment.pulses; index += 1) {
        const echo = new Node(`EchoPulse${index + 1}`);
        root.addChild(echo);
        const graphic = echo.addComponent(Graphics);
        graphic.strokeColor = color;
        graphic.lineWidth = 5;
        graphic.circle(0, 0, 42 + index * 18);
        graphic.stroke();
        echo.setScale(1.8 + index * 0.3, 1.8 + index * 0.3);
        const opacity = echo.addComponent(UIOpacity);
        tween(echo)
          .delay(index * 0.045)
          .to(0.16, { scale: new Vec3(0.35, 0.35) })
          .start();
        tween(opacity).delay(0.08).to(0.12, { opacity: 0 }).start();
      }
      return;
    }
    if (treatment.signature === 'blast') {
      for (let index = 0; index < Math.min(4, treatment.rings); index += 1) {
        const ring = new Node(`BlastRing${index + 1}`);
        root.addChild(ring);
        const graphic = ring.addComponent(Graphics);
        graphic.strokeColor = color;
        graphic.lineWidth = 3 + index;
        graphic.circle(0, 0, 44 + index * 15);
        graphic.stroke();
        ring.setScale(0.2, 0.2);
        tween(ring)
          .delay(index * 0.025)
          .to(0.18, { scale: new Vec3(1.5 + index * 0.12, 1.5 + index * 0.12) })
          .start();
      }
      return;
    }
    if (treatment.signature === 'handoff') {
      const handoff = new Node('HandoffOrbit');
      root.addChild(handoff);
      const graphic = handoff.addComponent(Graphics);
      graphic.strokeColor = COLORS.gold;
      graphic.lineWidth = 6;
      graphic.arc(0, 0, 74 + tier * 4, 0.25, 2.65, false);
      graphic.arc(0, 0, 74 + tier * 4, 3.4, 5.8, false);
      graphic.stroke();
      tween(handoff).by(0.2, { angle: 125 }).start();
      return;
    }
    if (treatment.signature === 'aura') {
      const aura = new Node('StatusAura');
      root.addChild(aura);
      const graphic = aura.addComponent(Graphics);
      graphic.strokeColor = color;
      graphic.lineWidth = 3;
      graphic.ellipse(0, -8, 60, 30);
      graphic.stroke();
      tween(aura).by(0.2, { angle: 90 }).start();
    }
  }

  private stopTree(node: Node): void {
    Tween.stopAllByTarget(node);
    node.children.forEach((child) => this.stopTree(child));
  }

  private addShockwave(root: Node, color: Color, tier: number): void {
    const shockwave = new Node('Shockwave');
    root.addChild(shockwave);
    const graphics = shockwave.addComponent(Graphics);
    graphics.strokeColor = color;
    graphics.lineWidth = 5 + tier;
    graphics.circle(0, 0, 52 + tier * 5);
    graphics.stroke();
    const opacity = shockwave.addComponent(UIOpacity);
    opacity.opacity = 230;
    shockwave.setScale(0.25, 0.25);
    tween(shockwave)
      .to(0.2 + tier * 0.012, {
        scale: new Vec3(1.35 + tier * 0.08, 1.35 + tier * 0.08, 1),
      })
      .start();
    tween(opacity)
      .to(0.22 + tier * 0.012, { opacity: 0 })
      .start();
  }

  private addImpactCore(root: Node, color: Color, tier: number): void {
    const core = new Node('ImpactCore');
    root.addChild(core);
    const graphics = core.addComponent(Graphics);
    graphics.fillColor = new Color(color.r, color.g, color.b, 190);
    graphics.circle(0, 0, 18 + tier * 3);
    graphics.fill();
    graphics.strokeColor = COLORS.text;
    graphics.lineWidth = 4;
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      graphics.moveTo(Math.cos(angle) * 22, Math.sin(angle) * 22);
      graphics.lineTo(Math.cos(angle) * (44 + tier * 6), Math.sin(angle) * (44 + tier * 6));
    }
    graphics.stroke();
    const opacity = core.addComponent(UIOpacity);
    tween(core)
      .to(0.1, { scale: new Vec3(1.25, 1.25, 1) })
      .start();
    tween(opacity).to(0.18, { opacity: 0 }).start();
  }

  private addRelayCue(root: Node, tier: number): void {
    const cue = createUiNode('RelayCue', root, 190, 54, 0, 94);
    const label = addText(
      cue,
      tier === 6 ? '終結・第 6 棒' : `接力・第 ${tier} 棒`,
      30,
      COLORS.gold,
    );
    label.isBold = true;
    const opacity = cue.addComponent(UIOpacity);
    tween(cue)
      .by(0.22, { position: new Vec3(0, 34) })
      .start();
    tween(opacity).delay(0.08).to(0.18, { opacity: 0 }).start();
  }
}
