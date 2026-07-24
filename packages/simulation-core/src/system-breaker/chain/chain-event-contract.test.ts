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

// @ts-expect-error MODULE_TRIGGERED must identify the applied effect.
const missingEffect: ChainEvent = {
  sequence: 3,
  type: 'MODULE_TRIGGERED',
  message: 'Invalid module event',
};

void resourceEvent;
void effectEvent;

// @ts-expect-error RESOURCE_CHANGED must include localizable signed resource changes.
const missingResourceChanges: ChainEvent = {
  sequence: 4,
  type: 'RESOURCE_CHANGED',
  message: 'Invalid resource event',
};

const effectOnlyResourceEvent: ChainEvent = {
  sequence: 5,
  type: 'RESOURCE_CHANGED',
  message: 'Invalid resource event',
  // @ts-expect-error RESOURCE_CHANGED cannot carry an effect-only payload.
  effect: 'PROTECT',
};

const effectOnThreatEvent: ChainEvent = {
  sequence: 6,
  type: 'THREAT_HIT',
  message: 'Invalid threat event',
  // @ts-expect-error THREAT_HIT has no module-effect payload.
  effect: 'PROTECT',
};

void missingResourceChanges;
void effectOnlyResourceEvent;
void missingEffect;
void effectOnThreatEvent;

it('keeps structured resource changes available to renderers', () => {
  expect(resourceEvent.resourceChanges).toEqual([
    { resource: 'PROGRESS', delta: 6 },
    { resource: 'INSTABILITY', delta: -2 },
  ]);
  expect(effectEvent.effect).toBe('PROTECT');
});
