import { lazy, Suspense, useEffect, type ComponentType } from 'react';

import { GuildRpgApp } from './guild-rpg/GuildRpgApp';

type Prototype = 'guild-rpg' | 'system-breaker' | 'expedition';
type PreservedPrototype = Exclude<Prototype, 'guild-rpg'>;

export async function loadPrototype(prototype: PreservedPrototype): Promise<ComponentType> {
  if (prototype === 'system-breaker') {
    return (await import('./system-breaker/SystemBreakerApp')).SystemBreakerApp;
  }
  return (await import('./legacy/LegacyExpedition')).LegacyExpedition;
}

const LazySystemBreaker = lazy(async () => ({
  default: await loadPrototype('system-breaker'),
}));
const LazyExpedition = lazy(async () => ({
  default: await loadPrototype('expedition'),
}));

export function App(props: { prototype?: Prototype }) {
  const query =
    typeof window === 'undefined' ? undefined : new URLSearchParams(window.location.search);
  const requested = props.prototype ?? query?.get('prototype');
  useEffect(() => {
    document.title =
      requested === 'system-breaker'
        ? 'SYSTEM BREAKER'
        : requested === 'expedition' || query?.get('legacy') === '1'
          ? 'Project Expedition'
          : '遠征者公會 · 六人接力刷寶 RPG';
  }, [query, requested]);
  if (requested === 'expedition' || query?.get('legacy') === '1') {
    return (
      <Suspense fallback={<PrototypeLoading />}>
        <LazyExpedition />
      </Suspense>
    );
  }
  if (requested === 'system-breaker') {
    return (
      <Suspense fallback={<PrototypeLoading />}>
        <LazySystemBreaker />
      </Suspense>
    );
  }
  return <GuildRpgApp />;
}

function PrototypeLoading() {
  return (
    <main aria-live="polite">
      <p>載入保留原型…</p>
    </main>
  );
}
