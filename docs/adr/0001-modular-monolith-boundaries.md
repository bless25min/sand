# ADR 0001: Use enforceable modular-monolith boundaries

## Status

Accepted.

## Context

The game combines deterministic simulation, rendering, progression, content, UI, and future AI adapters. A change in one area must not silently alter another area.

## Decision

Use a pnpm modular monolith with Hexagonal Architecture at external boundaries, Vertical Slices inside feature packages, and a Functional Core with thin imperative composition roots. Enforce package direction with TypeScript Project References, package exports, dependency-cruiser, and Knip.

## Alternatives

- A single application package was rejected because it does not protect rule ownership.
- Microservices were rejected because the single-player MVP does not need network boundaries.
- Nx was deferred because eight packages do not justify its additional project model.

## Consequences

- Each package needs a small public contract and README.
- Cross-package changes become explicit compile-time or architecture-check failures.
- Some local duplication is accepted until a stable shared abstraction exists.
