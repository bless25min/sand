import { LegacyExpedition } from './legacy/LegacyExpedition';
import { SystemBreakerApp } from './system-breaker/SystemBreakerApp';

export function App(props: { legacy?: boolean }) {
  const legacy =
    props.legacy ??
    (typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('legacy') === '1');

  return legacy ? <LegacyExpedition /> : <SystemBreakerApp />;
}
