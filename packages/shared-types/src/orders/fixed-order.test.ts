import { expect, it } from 'vitest';

import type { FixedOrder } from './fixed-order';

it('requires formation data only for a formation order', () => {
  const valid: FixedOrder = {
    unitId: 'heavy',
    action: 'CHANGE_FORMATION',
    formation: 'LINE',
  };

  // @ts-expect-error CHANGE_FORMATION must provide a formation.
  const missingFormation: FixedOrder = { unitId: 'heavy', action: 'CHANGE_FORMATION' };
  // @ts-expect-error Other commands cannot smuggle in a formation change.
  const unrelatedFormation: FixedOrder = { unitId: 'heavy', action: 'ATTACK', formation: 'LINE' };

  expect(valid.formation).toBe('LINE');
  expect(missingFormation.action).toBe('CHANGE_FORMATION');
  expect(unrelatedFormation.action).toBe('ATTACK');
});
