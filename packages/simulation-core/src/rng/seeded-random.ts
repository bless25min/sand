import type { RandomSource } from './random-source';

const UINT32_RANGE = 4_294_967_296;
const NON_ZERO_FALLBACK = 0x9e3779b9;

function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  const unsigned = hash >>> 0;
  return unsigned === 0 ? NON_ZERO_FALLBACK : unsigned;
}

export class SeededRandom implements RandomSource {
  private state: number;

  constructor(seed: string) {
    this.state = hashSeed(seed);
  }

  next(): number {
    let value = this.state;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.state = value >>> 0;

    return this.state / UINT32_RANGE;
  }

  nextInt(minimum: number, maximum: number): number {
    if (!Number.isInteger(minimum) || !Number.isInteger(maximum)) {
      throw new TypeError('bounds must be integers');
    }

    if (minimum > maximum) {
      throw new RangeError('minimum must be less than or equal to maximum');
    }

    return Math.floor(this.next() * (maximum - minimum + 1)) + minimum;
  }
}

export function createSeededRandom(seed: string): RandomSource {
  return new SeededRandom(seed);
}
