import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('identifies the Project Expedition development shell', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Project Expedition');
    expect(markup).toContain('遠征軍戰術沙盤');
    expect(markup).toContain('Simulation Core');
    expect(markup).toContain('掉落如何改變下一場戰鬥');
    expect(markup).toContain('角甲重盾');
    expect(markup).toContain('軍團成長與雙線轉職');
    expect(markup).toContain('重盾衛隊');
    expect(markup).toContain('獵獸射手');
  });
});
