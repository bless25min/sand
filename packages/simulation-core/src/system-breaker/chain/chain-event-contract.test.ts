import type { ChainEvent } from '@expedition/shared-types';
import { expect, it } from 'vitest';

const resourceEvent: ChainEvent = {
  sequence: 1,
  type: 'RESOURCE_CHANGED',
  message: 'Progress increased',
  resourceChanges: [
    { resource: 'PROGRESS', delta: 6 },
    { resource: 'INSTABILITY', delta: -2 },
  ],
};

const effectEvent: ChainEvent = {
  sequence: 2,
  type: 'MODULE_TRIGGERED',
  message: 'Protection applied',
  effect: 'PROTECT',
};

void resourceEvent;
void effectEvent;

// @ts-expect-error RESOURCE_CHANGED must include localizable signed resource changes.
const missingResourceChanges: ChainEvent = {
  sequence: 3,
  type: 'RESOURCE_CHANGED',
  message: 'Invalid resource event',
};

const effectOnlyResourceEvent: ChainEvent = {
  sequence: 4,
  type: 'RESOURCE_CHANGED',
  message: 'Invalid resource event',
  // @ts-expect-error RESOURCE_CHANGED cannot carry an effect-only payload.
  effect: 'PROTECT',
};

void missingResourceChanges;
void effectOnlyResourceEvent;

it('keeps structured resource changes available to renderers', () => {
  expect(resourceEvent.resourceChanges).toEqual([
    { resource: 'PROGRESS', delta: 6 },
    { resource: 'INSTABILITY', delta: -2 },
  ]);
  expect(effectEvent.effect).toBe('PROTECT');
});
