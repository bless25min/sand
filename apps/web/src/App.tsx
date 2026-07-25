import { LegacyExpedition } from './legacy/LegacyExpedition';
import { SystemBreakerApp } from './system-breaker/SystemBreakerApp';
import { GuildRpgApp } from './guild-rpg/GuildRpgApp';

type Prototype = 'guild-rpg' | 'system-breaker' | 'expedition';

export function App(props: { prototype?: Prototype }) {
  const query =
    typeof window === 'undefined' ? undefined : new URLSearchParams(window.location.search);
  const requested = props.prototype ?? query?.get('prototype');
  if (requested === 'expedition' || query?.get('legacy') === '1') return <LegacyExpedition />;
  if (requested === 'system-breaker') return <SystemBreakerApp />;
  return <GuildRpgApp />;
}
