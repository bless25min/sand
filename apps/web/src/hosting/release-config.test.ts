import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { resolveWebModulePreloadDependencies, webCodeSplitting } from '../../vite.config';

describe('Guild RPG release configuration', () => {
  it('uses Guild RPG document metadata', () => {
    const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

    expect(html).toContain('<title>遠征者公會 · 六人接力刷寶 RPG</title>');
    expect(html).toContain('配置六人固定技能與接力順序');
    expect(html).not.toContain('SYSTEM BREAKER 是一款');
  });

  it('splits React, Pixi, and preserved prototypes into explicit chunks', () => {
    expect(webCodeSplitting.groups.map((group) => group.name)).toEqual([
      'react',
      'pixi',
      'prototypes',
    ]);
  });

  it('keeps Pixi and its transitive runtime dependencies in one production chunk', () => {
    const pixiGroup = webCodeSplitting.groups.find((group) => group.name === 'pixi');

    expect(pixiGroup).toMatchObject({
      entriesAware: false,
      includeDependenciesRecursively: true,
    });
  });

  it('does not preload battle rendering or preserved prototypes from the landing document', () => {
    expect(
      resolveWebModulePreloadDependencies('index.js', ['react.js', 'pixi.js', 'prototypes.js'], {
        hostId: 'index.html',
        hostType: 'html',
      }),
    ).toEqual(['react.js']);
  });
});
