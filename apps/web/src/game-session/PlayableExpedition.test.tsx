import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PlayableExpedition } from './PlayableExpedition';

describe('PlayableExpedition', () => {
  it('renders a player-operated battle with four units and fixed orders', () => {
    const markup = renderToStaticMarkup(<PlayableExpedition />);

    expect(markup).toContain('可玩遠征');
    expect(markup).toContain('第一重步兵團');
    expect(markup).toContain('松望弓兵團');
    expect(markup).toContain('曙槍騎兵隊');
    expect(markup).toContain('餘燼英雄小隊');
    expect(markup).toContain('推進');
    expect(markup).toContain('固守');
    expect(markup).toContain('攻擊');
    expect(markup).toContain('撤退');
    expect(markup).toContain('變換陣形');
    expect(markup).toContain('戰鬥 → 掉落 → 製造 → 裝備 → 再戰');
    expect(markup.match(/data-testid="unit-select"/g)).toHaveLength(4);
  });
});
