import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createGuildRpgState } from '../state/create-game-state';
import { GuildSettingsPanel } from './GuildSettingsPanel';

describe('Guild settings panel', () => {
  it('keeps resume, audiovisual preferences, tutorial, and safe abandon reachable', () => {
    const markup = renderToStaticMarkup(
      <GuildSettingsPanel
        state={{ ...createGuildRpgState(), settingsOpen: true, paused: true, screen: 'battle' }}
        dispatch={() => undefined}
      />,
    );

    expect(markup).toContain('aria-label="遊戲設定"');
    expect(markup).toContain('音效音量');
    expect(markup).toContain('戰鬥音效');
    expect(markup).toContain('震動');
    expect(markup).toContain('減少動態');
    expect(markup).toContain('重新播放教學');
    expect(markup).toContain('繼續戰鬥');
    expect(markup).toContain('中止本次遠征');
  });
});
