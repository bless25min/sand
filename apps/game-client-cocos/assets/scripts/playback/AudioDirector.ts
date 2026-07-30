import { AudioClip, AudioSource, Component, resources } from 'cc';

export class AudioDirector extends Component {
  private source?: AudioSource;
  private impacts: readonly AudioClip[] = [];
  private finisher?: AudioClip;
  private audioEnabled = true;
  private masterVolume = 0.45;

  initialize(enabled: boolean, masterVolume: number): void {
    this.audioEnabled = enabled;
    this.masterVolume = Math.max(0, Math.min(1, masterVolume));
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
    if (!this.audioEnabled || this.masterVolume <= 0) return;
    const clip = isFinisher
      ? this.finisher
      : this.impacts[Math.min(this.impacts.length - 1, tier - 1)];
    if (!clip || !this.source) return;
    this.source.volume = Math.min(1, this.masterVolume * (0.72 + tier * 0.08));
    this.source.playOneShot(clip);
  }
}
