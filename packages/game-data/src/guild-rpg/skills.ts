import type { GuildSkillDefinition } from '@expedition/shared-types';

export const GUILD_SKILLS: Readonly<Record<string, GuildSkillDefinition>> = {
  basic_attack: {
    id: 'basic_attack',
    name: '普通攻擊',
    description: '可靠地攻擊選定敵人。',
    kind: 'attack',
    target: 'enemy',
    power: 1,
    threat: 1,
  },
  shield_wall: {
    id: 'shield_wall',
    name: '盾牆挑釁',
    description: '進入防禦姿態並大幅提高仇恨。',
    kind: 'guard',
    target: 'self',
    power: 0,
    threat: 65,
  },
  focused_shot: {
    id: 'focused_shot',
    name: '弱點狙擊',
    description: '造成 165% 攻擊傷害。',
    kind: 'attack',
    target: 'enemy',
    power: 1.65,
    threat: 1.2,
  },
  healing_prayer: {
    id: 'healing_prayer',
    name: '治癒禱言',
    description: '回復一名隊友的生命。',
    kind: 'heal',
    target: 'ally',
    power: 1.45,
    threat: 0.5,
  },
};
