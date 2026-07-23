# Project Expedition C4 Containers and Components

## Containers

- Web Client: React composition, fixed command UI, management UI, and PixiJS battlefield.
- Worker API: HTTP boundary for future saves and AI adapters.

## Components

```text
Web Client
├─ command-schema
├─ simulation-core
├─ progression-core
├─ pixi-renderer
├─ game-data
└─ shared-types

Worker API
├─ command-schema
└─ shared-types
```

## Dependency Rule

Adapters depend on stable contracts and pure cores. Pure cores never depend on adapters.
