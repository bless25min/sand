import { AudioClip, AudioSource, Component, resources } from 'cc';

export class AudioDirector extends Component {
  private source?: AudioSource;
  private impacts: readonly AudioClip[] = [];
  private finisher?: AudioClip;

  initialize(): void {
    this.source = this.node.getComponent(AudioSource) ?? this.node.addComponent(AudioSource);
    resources.loadDir('audio', AudioClip, (error, clips) => {
      if (error) {
        console.warn('Unable to load generated combat audio', error);
        return;
      }
      this.impacts = clips
        .filter(({ name }) => name.startsWith('impact-'))
        .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }));
      this.finisher = clips.find(({ name }) => name === 'finisher');
    });
  }

  playImpact(tier: number, isFinisher: boolean): void {
    const clip = isFinisher
      ? this.finisher
      : this.impacts[Math.min(this.impacts.length - 1, tier - 1)];
    if (!clip || !this.source) return;
    this.source.volume = Math.min(1, 0.45 + tier * 0.08);
    this.source.playOneShot(clip);
  }
}
