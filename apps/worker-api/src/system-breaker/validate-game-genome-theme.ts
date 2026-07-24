import type { CoreResourceId } from '@expedition/shared-types';

interface ModuleSkin {
  name: string;
  description: string;
}

interface ThreatSkin {
  name: string;
  telegraph: string;
}

interface EndingCopy {
  title: string;
  description: string;
}

export interface GameGenomeTheme {
  title: string;
  premise: string;
  aliases: Record<CoreResourceId, string>;
  winDescription: string;
  failDescription: string;
  modules: ModuleSkin[];
  threats: ThreatSkin[];
  counters: string[];
  endings: {
    victory: EndingCopy;
    defeat: EndingCopy;
  };
}

type JsonObject = Record<string, unknown>;

const invalidTheme = (): never => {
  throw new Error('INVALID_GAME_GENOME_THEME');
};

function readObject(value: unknown, keys: readonly string[]): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalidTheme();
  const object = value as JsonObject;
  const actualKeys = Object.keys(object);
  if (actualKeys.length !== keys.length || actualKeys.some((key) => !keys.includes(key))) {
    return invalidTheme();
  }
  return object;
}

function readText(value: unknown, maximum: number): string {
  if (typeof value !== 'string' || value.length > maximum) return invalidTheme();
  const cleaned = value
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || invalidTheme();
}

function readArray(value: unknown, length: number): unknown[] {
  if (!Array.isArray(value) || value.length !== length) return invalidTheme();
  return value;
}

const readModule = (value: unknown): ModuleSkin => {
  const module = readObject(value, ['name', 'description']);
  return {
    name: readText(module.name, 32),
    description: readText(module.description, 160),
  };
};

const readThreat = (value: unknown): ThreatSkin => {
  const threat = readObject(value, ['name', 'telegraph']);
  return {
    name: readText(threat.name, 40),
    telegraph: readText(threat.telegraph, 160),
  };
};

const readEnding = (value: unknown): EndingCopy => {
  const ending = readObject(value, ['title', 'description']);
  return {
    title: readText(ending.title, 40),
    description: readText(ending.description, 160),
  };
};

export function validateGameGenomeTheme(input: unknown): GameGenomeTheme {
  const theme = readObject(input, [
    'title',
    'premise',
    'aliases',
    'winDescription',
    'failDescription',
    'modules',
    'threats',
    'counters',
    'endings',
  ]);
  const aliases = readObject(theme.aliases, ['PROGRESS', 'INTEGRITY', 'INSTABILITY', 'CREDITS']);
  const endings = readObject(theme.endings, ['victory', 'defeat']);

  return {
    title: readText(theme.title, 80),
    premise: readText(theme.premise, 240),
    aliases: {
      PROGRESS: readText(aliases.PROGRESS, 16),
      INTEGRITY: readText(aliases.INTEGRITY, 16),
      INSTABILITY: readText(aliases.INSTABILITY, 16),
      CREDITS: readText(aliases.CREDITS, 16),
    },
    winDescription: readText(theme.winDescription, 160),
    failDescription: readText(theme.failDescription, 160),
    modules: readArray(theme.modules, 12).map(readModule),
    threats: readArray(theme.threats, 7).map(readThreat),
    counters: readArray(theme.counters, 3).map((label) => readText(label, 80)),
    endings: {
      victory: readEnding(endings.victory),
      defeat: readEnding(endings.defeat),
    },
  };
}
