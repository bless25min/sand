import type { GameGenome } from '@expedition/shared-types';

import { validateGameGenome } from '../genome/validate-game-genome';

const PREFIX = 'SB1.';

export function encodeRunCode(genome: GameGenome): string {
  return `${PREFIX}${encodeURIComponent(JSON.stringify(genome))}`;
}

export function decodeRunCode(code: string): GameGenome {
  try {
    if (!code.startsWith(PREFIX)) throw new Error();
    const genome = JSON.parse(decodeURIComponent(code.slice(PREFIX.length))) as GameGenome;
    if (!validateGameGenome(genome).valid) throw new Error();
    return genome;
  } catch {
    throw new Error('INVALID_RUN_CODE');
  }
}
