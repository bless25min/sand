import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { App, loadPrototype } from './App';

describe('App', () => {
  it('uses the guild RPG as the default playable product', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('遠征者公會');
    expect(markup).toContain('邊境狼群');
    expect(markup).toContain('開始遠征');
    expect(markup).not.toContain('data-testid="playable-expedition"');
  });

  it('keeps SYSTEM BREAKER behind an explicit lazy prototype switch', async () => {
    const Prototype = await loadPrototype('system-breaker');
    const markup = renderToStaticMarkup(<Prototype />);

    expect(markup).toContain('SYSTEM BREAKER');
  });

  it('keeps the former expedition behind an explicit lazy prototype switch', async () => {
    const Prototype = await loadPrototype('expedition');
    const markup = renderToStaticMarkup(<Prototype />);

    expect(markup).toContain('Project Expedition');
    expect(markup).toContain('data-testid="playable-expedition"');
  });
});
