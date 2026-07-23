import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createLegionGrowthSnapshot } from './create-legion-growth-snapshot';
import { LegionGrowthPanel } from './LegionGrowthPanel';

describe('LegionGrowthPanel', () => {
  it('renders both completed growth paths and their next-battle evidence', () => {
    const markup = renderToStaticMarkup(
      <LegionGrowthPanel snapshot={createLegionGrowthSnapshot()} />,
    );

    expect(markup).toContain('軍團成長與雙線轉職');
    expect(markup).toContain('重盾衛隊');
    expect(markup).toContain('盾牆訓練');
    expect(markup).toContain('獵獸射手');
    expect(markup).toContain('獵獸操典');
    expect(markup).toContain('傷兵治療');
    expect(markup).toContain('補員');
    expect(markup).toContain('下一場戰鬥');
    expect(markup.match(/data-testid="growth-unit-card"/g)).toHaveLength(2);
  });

  it('falls back to the traceable reason code for an untranslated experience reason', () => {
    const snapshot = createLegionGrowthSnapshot();
    const firstUnit = snapshot.units[0]!;
    const firstDetail = firstUnit.experienceDetails[0]!;
    const markup = renderToStaticMarkup(
      <LegionGrowthPanel
        snapshot={{
          units: [
            {
              ...firstUnit,
              experienceDetails: [{ ...firstDetail, reason: 'ALLY_PROTECTED' }],
            },
            snapshot.units[1],
          ],
        }}
      />,
    );

    expect(markup).toContain('ALLY_PROTECTED');
  });
});
