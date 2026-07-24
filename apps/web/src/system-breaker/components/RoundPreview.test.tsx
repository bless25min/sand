import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { RoundPreview } from './RoundPreview';

describe('RoundPreview', () => {
  it('renders only the passed canonical preview values and counter details', () => {
    const markup = renderToStaticMarkup(
      <RoundPreview
        preview={{
          projectedProgress: 17,
          targetProgress: 20,
          success: false,
          integrity: 82,
          instability: 41,
          credits: 27,
          triggeredCount: 3,
          blockedCount: 2,
        }}
        counter={{ id: 'counter-1', role: 'DEFENSE', label: '防禦抑制場', outputMultiplier: 0.75 }}
      />,
    );

    expect(markup).toContain('17 / 20');
    expect(markup).toContain('預測未達標');
    expect(markup).toContain('82');
    expect(markup).toContain('41');
    expect(markup).toContain('27');
    expect(markup).toContain('觸發 3');
    expect(markup).toContain('受阻 2');
    expect(markup).toContain('反制：防禦（');
    expect(markup).toContain('0.75×');
  });
});
