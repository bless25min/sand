export type GuildStatKey = 'hp' | 'attack' | 'defense' | 'speed' | 'healing';

export interface GuildStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  healing: number;
}

export interface StatModifier {
  stat: GuildStatKey;
  value: number;
  sourceId?: string | undefined;
  label?: string | undefined;
}
