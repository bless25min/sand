import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('uses SYSTEM BREAKER as the default playable product', () => {
    const markup = renderToStaticMarkup(<App legacy={false} />);

    expect(markup).toContain('SYSTEM BREAKER');
    expect(markup).toContain('輸入一個世界');
    expect(markup).toContain('生成可破壞系統');
    expect(markup).not.toContain('data-testid="playable-expedition"');
  });

  it('keeps the former expedition available only through legacy mode', () => {
    const markup = renderToStaticMarkup(<App legacy />);

    expect(markup).toContain('Project Expedition');
    expect(markup).toContain('data-testid="playable-expedition"');
  });
});
