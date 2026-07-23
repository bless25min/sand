import type { LocalPressureResult } from '../combat/calculate-local-pressure';
import type { RandomSource } from '../rng/random-source';

const BASE_CASUALTY_RATE = 0.02;
const MAX_CASUALTY_RATE = 0.05;

export interface CalculateCasualtiesInput {
  readonly pressure: LocalPressureResult;
  readonly attackingTroopCount: number;
  readonly defendingTroopCount: number;
  readonly random: RandomSource;
}

export interface CasualtyResult {
  readonly attackerLosses: number;
  readonly defenderLosses: number;
  readonly exchangeIntensity: number;
}

function assertTroopCount(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer`);
  }
}

function assertPressure(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be non-negative and finite`);
  }
}

function boundedRate(opposingPressure: number, ownPressure: number): number {
  if (opposingPressure === 0) {
    return 0;
  }

  if (ownPressure === 0) {
    return MAX_CASUALTY_RATE;
  }

  return Math.min(MAX_CASUALTY_RATE, BASE_CASUALTY_RATE * (opposingPressure / ownPressure));
}

function boundedLosses(
  troopCount: number,
  casualtyRate: number,
  exchangeIntensity: number,
): number {
  if (troopCount <= 1 || casualtyRate === 0) {
    return 0;
  }

  const calculated = Math.max(1, Math.round(troopCount * casualtyRate * exchangeIntensity));
  const rateCap = Math.max(1, Math.floor(troopCount * MAX_CASUALTY_RATE));

  return Math.min(calculated, rateCap, troopCount - 1);
}

export function calculateCasualties(input: CalculateCasualtiesInput): CasualtyResult {
  assertTroopCount(input.attackingTroopCount, 'attackingTroopCount');
  assertTroopCount(input.defendingTroopCount, 'defendingTroopCount');
  assertPressure(input.pressure.attackingPressure, 'attackingPressure');
  assertPressure(input.pressure.defendingPressure, 'defendingPressure');

  if (input.pressure.attackingPressure === 0 && input.pressure.defendingPressure === 0) {
    return {
      attackerLosses: 0,
      defenderLosses: 0,
      exchangeIntensity: 0,
    };
  }

  const randomValue = input.random.next();

  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
    throw new RangeError('RandomSource.next must return a value in [0, 1)');
  }

  const exchangeIntensity = 0.9 + randomValue * 0.2;
  const attackerLossRate = boundedRate(
    input.pressure.defendingPressure,
    input.pressure.attackingPressure,
  );
  const defenderLossRate = boundedRate(
    input.pressure.attackingPressure,
    input.pressure.defendingPressure,
  );

  return {
    attackerLosses: boundedLosses(input.attackingTroopCount, attackerLossRate, exchangeIntensity),
    defenderLosses: boundedLosses(input.defendingTroopCount, defenderLossRate, exchangeIntensity),
    exchangeIntensity,
  };
}
