const text = (maximum: number) => ({
  type: 'string',
  minLength: 1,
  maxLength: maximum,
});

const moduleSkin = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'description'],
  properties: {
    name: text(32),
    description: text(160),
  },
};

const threatSkin = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'telegraph'],
  properties: {
    name: text(40),
    telegraph: text(160),
  },
};

const ending = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'description'],
  properties: {
    title: text(40),
    description: text(160),
  },
};

export const GAME_GENOME_THEME_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'title',
    'premise',
    'aliases',
    'winDescription',
    'failDescription',
    'modules',
    'threats',
    'counters',
    'endings',
  ],
  properties: {
    title: text(80),
    premise: text(240),
    aliases: {
      type: 'object',
      additionalProperties: false,
      required: ['PROGRESS', 'INTEGRITY', 'INSTABILITY', 'CREDITS'],
      properties: {
        PROGRESS: text(16),
        INTEGRITY: text(16),
        INSTABILITY: text(16),
        CREDITS: text(16),
      },
    },
    winDescription: text(160),
    failDescription: text(160),
    modules: {
      type: 'array',
      minItems: 12,
      maxItems: 12,
      items: moduleSkin,
    },
    threats: {
      type: 'array',
      minItems: 7,
      maxItems: 7,
      items: threatSkin,
    },
    counters: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: text(80),
    },
    endings: {
      type: 'object',
      additionalProperties: false,
      required: ['victory', 'defeat'],
      properties: {
        victory: ending,
        defeat: ending,
      },
    },
  },
} as const;
