# Pixi Renderer

## Responsibility

Visual projection and PixiJS lifecycle.

## Public Input

- Read-only visual snapshots.
- Battle events.

## Public Output

- Canvas visuals.
- Selection signals.

## Allowed Dependencies

- `@expedition/shared-types`.
- PixiJS when rendering begins.

## Forbidden Responsibilities

- Casualties.
- Morale.
- Loot.
- Simulation mutation.
