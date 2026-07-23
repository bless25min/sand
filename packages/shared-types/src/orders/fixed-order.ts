import type { FormationType } from '../units/formation-type';

export type FixedOrderAction = 'ADVANCE' | 'HOLD' | 'ATTACK' | 'RETREAT' | 'CHANGE_FORMATION';

type FormationOrder = {
  readonly unitId: string;
  readonly action: 'CHANGE_FORMATION';
  readonly formation: FormationType;
};

type NonFormationOrder = {
  readonly unitId: string;
  readonly action: Exclude<FixedOrderAction, 'CHANGE_FORMATION'>;
  readonly formation?: never;
};

export type FixedOrder = FormationOrder | NonFormationOrder;
