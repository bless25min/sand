import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('identifies the Project Expedition development shell', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Project Expedition');
    expect(markup).toContain('遠征軍戰術沙盤');
  });
});
