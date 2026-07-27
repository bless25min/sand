import { GUILD_GAME_CONTENT } from '@expedition/game-data';

export interface HeroVisualIdentity {
  id: string;
  sigil: string;
  primary: number;
  secondary: number;
  accent: number;
  weapon: 'shield' | 'bow' | 'staff' | 'flask' | 'tome' | 'blades';
}

export interface EnemyVisualIdentity {
  id: string;
  family: 'greyfang' | 'deepmine' | 'ember' | 'storm';
  archetype: 'skirmisher' | 'brute' | 'guardian' | 'artillery' | 'boss' | 'flying';
  primary: number;
  secondary: number;
  accent: number;
  scale: number;
  crowned?: boolean;
}

export interface ZoneVisualIdentity {
  id: string;
  skyTop: number;
  skyBottom: number;
  ground: number;
  accent: number;
  atmosphere: 'moon-mist' | 'ore-dust' | 'ember-ash' | 'storm-rain';
  weather: 'cloud-drift' | 'falling-cinders' | 'ash-squall' | 'forked-lightning';
}

export const HERO_VISUALS: Readonly<Record<string, HeroVisualIdentity>> = {
  brann: {
    id: 'brann',
    sigil: '盾',
    primary: 0xc1533b,
    secondary: 0x4c2624,
    accent: 0xffc46b,
    weapon: 'shield',
  },
  lyra: {
    id: 'lyra',
    sigil: '羽',
    primary: 0x6db879,
    secondary: 0x183f35,
    accent: 0xe5f8a9,
    weapon: 'bow',
  },
  elin: {
    id: 'elin',
    sigil: '潮',
    primary: 0x6ebbd1,
    secondary: 0x183b55,
    accent: 0xe7fbff,
    weapon: 'staff',
  },
  seph: {
    id: 'seph',
    sigil: '瘴',
    primary: 0x82b94b,
    secondary: 0x334019,
    accent: 0xd5ff6d,
    weapon: 'flask',
  },
  lorne: {
    id: 'lorne',
    sigil: '令',
    primary: 0x738ee8,
    secondary: 0x222b66,
    accent: 0xd4ddff,
    weapon: 'tome',
  },
  kyro: {
    id: 'kyro',
    sigil: '燼',
    primary: 0xef7244,
    secondary: 0x561d2a,
    accent: 0xffe17d,
    weapon: 'blades',
  },
};

export const ENEMY_VISUALS: Readonly<Record<string, EnemyVisualIdentity>> = {
  wolf_scout: enemy('wolf_scout', 'greyfang', 'skirmisher', 0x63727a, 0x1f282c, 0xd3e5e8, 0.84),
  wolf_hunter: enemy('wolf_hunter', 'greyfang', 'brute', 0x895444, 0x2d2020, 0xf2a06b, 0.96),
  wolf_alpha: enemy('wolf_alpha', 'greyfang', 'boss', 0xb8793a, 0x332315, 0xffd36a, 1.14, true),
  wolf_nightstalker: enemy(
    'wolf_nightstalker',
    'greyfang',
    'skirmisher',
    0x6a4a83,
    0x21172f,
    0xd49cff,
    1.04,
  ),
  fang_matron: enemy('fang_matron', 'greyfang', 'boss', 0xa93343, 0x3a121c, 0xffcf73, 1.28, true),
  goblin_guard: enemy('goblin_guard', 'deepmine', 'guardian', 0x6e8252, 0x2a3325, 0xffc35a, 1.04),
  goblin_raider: enemy('goblin_raider', 'deepmine', 'brute', 0x8d5b3a, 0x38251a, 0xff8b57, 0.94),
  goblin_slinger: enemy(
    'goblin_slinger',
    'deepmine',
    'artillery',
    0x8b8a4c,
    0x302f1d,
    0xffe46b,
    0.86,
  ),
  powder_alchemist: enemy(
    'powder_alchemist',
    'deepmine',
    'artillery',
    0x769c32,
    0x273112,
    0xdfff63,
    1.08,
  ),
  ore_tyrant: enemy('ore_tyrant', 'deepmine', 'boss', 0x9d6545, 0x34251e, 0xffa24b, 1.34, true),
  ember_whelp: enemy('ember_whelp', 'ember', 'boss', 0xb74236, 0x3e1522, 0xffc563, 1.18, true),
  shrine_drake: enemy('shrine_drake', 'ember', 'flying', 0x8c5361, 0x311d2a, 0xff9d63, 1.05),
  ash_cantor: enemy('ash_cantor', 'ember', 'artillery', 0xb28a5a, 0x3b2d27, 0xffdf92, 1.04),
  solar_wyvern: enemy('solar_wyvern', 'ember', 'flying', 0xd66b36, 0x4a2318, 0xffffb0, 1.38, true),
  tempest_lancer: enemy('tempest_lancer', 'storm', 'brute', 0x477fc0, 0x182a55, 0xa7eaff, 1.08),
  coil_sentinel: enemy('coil_sentinel', 'storm', 'guardian', 0x3e8da2, 0x183541, 0x8afff1, 1.16),
  arc_magus: enemy('arc_magus', 'storm', 'artillery', 0x7557b8, 0x2a1e48, 0xdab4ff, 1.1),
  skybreaker_sovereign: enemy(
    'skybreaker_sovereign',
    'storm',
    'boss',
    0xaec5df,
    0x2a385d,
    0xffffc2,
    1.48,
    true,
  ),
};

export const ZONE_VISUALS: Readonly<Record<string, ZoneVisualIdentity>> = {
  greyfang_frontier: {
    id: 'greyfang_frontier',
    skyTop: 0x081b1d,
    skyBottom: 0x183237,
    ground: 0x142923,
    accent: 0xe1b568,
    atmosphere: 'moon-mist',
    weather: 'cloud-drift',
  },
  deepmine_front: {
    id: 'deepmine_front',
    skyTop: 0x111813,
    skyBottom: 0x31432d,
    ground: 0x2b2a21,
    accent: 0xffae54,
    atmosphere: 'ore-dust',
    weather: 'falling-cinders',
  },
  ember_sanctum: {
    id: 'ember_sanctum',
    skyTop: 0x200d1b,
    skyBottom: 0x6a2521,
    ground: 0x321923,
    accent: 0xffb352,
    atmosphere: 'ember-ash',
    weather: 'ash-squall',
  },
  storm_citadel: {
    id: 'storm_citadel',
    skyTop: 0x07162a,
    skyBottom: 0x243a63,
    ground: 0x17253b,
    accent: 0xa8f5ff,
    atmosphere: 'storm-rain',
    weather: 'forked-lightning',
  },
};

function enemy(
  id: string,
  family: EnemyVisualIdentity['family'],
  archetype: EnemyVisualIdentity['archetype'],
  primary: number,
  secondary: number,
  accent: number,
  scale: number,
  crowned = false,
): EnemyVisualIdentity {
  return {
    id,
    family,
    archetype,
    primary,
    secondary,
    accent,
    scale,
    ...(crowned ? { crowned: true } : {}),
  };
}

const UNKNOWN_HERO: HeroVisualIdentity = {
  id: 'unknown',
  sigil: '?',
  primary: 0x73817c,
  secondary: 0x202b28,
  accent: 0xd8e4de,
  weapon: 'staff',
};

const UNKNOWN_ENEMY: EnemyVisualIdentity = enemy(
  'unknown',
  'greyfang',
  'brute',
  0x737c78,
  0x242a27,
  0xe3e7df,
  1,
);

export const heroVisual = (id: string) => HERO_VISUALS[id] ?? { ...UNKNOWN_HERO, id };
export const enemyVisual = (id: string) => ENEMY_VISUALS[id] ?? { ...UNKNOWN_ENEMY, id };

export function zoneVisualForQuest(questId: string): ZoneVisualIdentity {
  const zoneId =
    GUILD_GAME_CONTENT.quests.find(({ id }) => id === questId)?.zoneId ?? 'greyfang_frontier';
  return ZONE_VISUALS[zoneId] ?? ZONE_VISUALS.greyfang_frontier!;
}
