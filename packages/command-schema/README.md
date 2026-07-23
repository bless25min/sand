# Command Schema

## Responsibility

Command contracts and untrusted-input validation.

## Public Input

- Raw command payloads.

## Public Output

- Validated `UnitOrder` data or structured validation errors.

## Allowed Dependencies

- `@expedition/shared-types`.
- Zod when command validation begins.

## Forbidden Responsibilities

- Battle outcomes.
- Direct state mutation.
