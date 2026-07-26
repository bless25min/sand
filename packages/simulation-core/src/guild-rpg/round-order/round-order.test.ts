import { describe, expect, it } from 'vitest';

import { chooseNextAdventurer } from './choose-next-adventurer';
import { completeTurn } from './complete-turn';
import { createRoundOrder } from './create-round-order';
import { resetCurrentRoundOrder, setRoundOrderCarry } from './update-round-order';

const HEROES = ['brann', 'lyra', 'elin', 'seph', 'lorne', 'kyro'];

describe('six-hero round order', () => {
  it('starts from the configured six-hero default order', () => {
    expect(createRoundOrder(HEROES)).toEqual({
      defaultOrder: HEROES,
      currentOrder: HEROES,
      actedIds: [],
      activeAdventurerId: 'brann',
      carryCurrentOrder: false,
    });
  });

  it('moves only an unacted living hero into the next position', () => {
    const afterBrann = completeTurn(createRoundOrder(HEROES), 'brann');
    const reordered = chooseNextAdventurer(afterBrann, 'seph', HEROES);

    expect(reordered.currentOrder).toEqual(['brann', 'seph', 'lyra', 'elin', 'lorne', 'kyro']);
    expect(reordered.activeAdventurerId).toBe('seph');
    expect(() => chooseNextAdventurer(reordered, 'brann', HEROES)).toThrow('already acted');
  });

  it('resets temporary changes at round end unless carry-forward is enabled', () => {
    let temporary = chooseNextAdventurer(createRoundOrder(HEROES), 'seph', HEROES);
    for (const heroId of temporary.currentOrder) temporary = completeTurn(temporary, heroId);
    expect(temporary.currentOrder).toEqual(HEROES);
    expect(temporary.activeAdventurerId).toBe('brann');

    let carried = {
      ...chooseNextAdventurer(createRoundOrder(HEROES), 'seph', HEROES),
      carryCurrentOrder: true,
    };
    const expected = carried.currentOrder;
    for (const heroId of carried.currentOrder) carried = completeTurn(carried, heroId);
    expect(carried.currentOrder).toEqual(expected);
    expect(carried.activeAdventurerId).toBe('seph');
  });

  it('lets the player restore the remaining default order or explicitly carry changes', () => {
    const afterBrann = completeTurn(createRoundOrder(HEROES), 'brann');
    const reordered = chooseNextAdventurer(afterBrann, 'seph', HEROES);
    const reset = resetCurrentRoundOrder(reordered, HEROES);

    expect(reset.currentOrder).toEqual(HEROES);
    expect(reset.activeAdventurerId).toBe('lyra');
    expect(setRoundOrderCarry(reordered, true).carryCurrentOrder).toBe(true);
  });
});
