# Simulation Core

## Responsibility

Deterministic battle rules and invariants.

## Public Input

- Stable shared contracts.
- Validated commands.
- `RandomSource`.

## Public Output

- State updates.
- `BattleEvent` values.
- Seeded, positioned loot drops.

## Allowed Dependencies

- `@expedition/shared-types`.

## Forbidden Responsibilities

- React.
- PixiJS.
- HTTP or Worker APIs.
- AI and persistence.
