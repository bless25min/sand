import type { FormationType, MonsterBehaviorState, UnitType } from '@expedition/shared-types';

const ROLE_LABELS: Readonly<Record<UnitType, string>> = {
  HEAVY_INFANTRY: '前衛',
  ARCHER: '遠射',
  CAVALRY: '突擊',
  HERO_TEAM: '支援',
};

const FORMATION_LABELS: Readonly<Record<FormationType, string>> = {
  DENSE_BLOCK: '密集方陣',
  LINE: '橫列',
  COLUMN: '縱列',
  LOOSE: '散開',
  SQUARE: '方陣',
  WEDGE: '楔形',
};

const INTENT_LABELS: Readonly<Record<MonsterBehaviorState, string>> = {
  IDLE: '潛伏觀望',
  HUNTING: '正面追獵',
  ENCIRCLING: '迂迴包圍',
  ENGAGED: '近身撕咬',
  RETREATING: '脫離戰線',
  ROUTING: '潰散逃亡',
};

export function roleLabel(unitType: UnitType): string {
  return ROLE_LABELS[unitType];
}

export function formationLabel(formation: FormationType): string {
  return FORMATION_LABELS[formation];
}

export function intentLabel(intent: MonsterBehaviorState): string {
  return INTENT_LABELS[intent];
}
