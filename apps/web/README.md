# Web Client

## Responsibility

Client UI and the browser composition root.

## Public Input

- Player input.
- Public outputs from the workspace packages used by the client.

## Public Output

- Browser UI.
- Explicit adapter calls.

## Allowed Dependencies

- Public `@expedition/*` entries used by the client.
- React and browser-facing adapters.

## Forbidden Responsibilities

- Battle formulas.
- Direct persistence rules.
