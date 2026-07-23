# Worker API

## Responsibility

HTTP and future external-service adapters.

## Public Input

- HTTP requests.

## Public Output

- Validated HTTP responses.

## Allowed Dependencies

- `@expedition/shared-types`.
- `@expedition/command-schema`.
- Hono.

## Forbidden Responsibilities

- Rendering.
- Client battle simulation.
