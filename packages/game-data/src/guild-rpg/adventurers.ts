import type { AdventurerDefinition } from '@expedition/shared-types';

export const GUILD_ADVENTURERS: readonly AdventurerDefinition[] = [
  {
    id: 'brann',
    name: '布蘭',
    title: '不動鐵壁',
    role: 'vanguard',
    baseStats: { hp: 280, attack: 24, defense: 21, speed: 10, healing: 0 },
    skillIds: ['basic_attack', 'shield_wall'],
  },
  {
    id: 'lyra',
    name: '萊拉',
    title: '破風鷹眼',
    role: 'ranger',
    baseStats: { hp: 190, attack: 35, defense: 10, speed: 15, healing: 0 },
    skillIds: ['basic_attack', 'focused_shot'],
  },
  {
    id: 'elin',
    name: '艾琳',
    title: '晨光祈禱者',
    role: 'cleric',
    baseStats: { hp: 220, attack: 18, defense: 12, speed: 11, healing: 34 },
    skillIds: ['basic_attack', 'healing_prayer'],
  },
];
