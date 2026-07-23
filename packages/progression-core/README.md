# Progression Core

## Responsibility

Loot, inventory, crafting, equipment, experience, recovery, reinforcement, and promotion rules.

## Public Input

- Battle results.
- Recipes.
- Inventory.
- Material definitions supplied by the composition root.
- Equipment definitions supplied by the composition root.
- Experience awards and level rules.
- Wounded units, treatment capacity, and recruit availability.
- Unit class and skill definitions.

## Public Output

- Progression state updates and traceable growth events.
- Recovery, retreat-loss, crafting, equipment, treatment, reinforcement, and promotion results.

## Allowed Dependencies

- `@expedition/shared-types`.

## Forbidden Responsibilities

- React.
- PixiJS.
- HTTP.
- Battle simulation.
