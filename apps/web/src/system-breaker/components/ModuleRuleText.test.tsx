import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { GameModuleDefinition } from '@expedition/shared-types';

import { ModuleRuleText } from './ModuleRuleText';

const module = (overrides: Partial<GameModuleDefinition>): GameModuleDefinition => ({
  id: 'module',
  name: '測試模組',
  description: '測試用',
  role: 'PRODUCER',
  trigger: 'ROUND_START',
  effect: 'ADD_PROGRESS',
  target: 'SELF',
  baseValue: 4,
  cost: 4,
  cooldown: 2,
  ...overrides,
});

describe('ModuleRuleText', () => {
  it.each([
    ['ROUND_START', '每回合第一階段開始時'],
    ['FIXED_TIME', '每回合第二階段時'],
    ['DAMAGED', '前一回合完整度受損時'],
    ['DISABLED', '自身格被封鎖或鎖定時'],
    ['ADJACENT_TRIGGER', '正交相鄰模組已啟動後'],
    ['RESOURCE_THRESHOLD', '進度達當前目標一半，或不穩定度達 50 時'],
  ] as const)('explains the exact %s trigger in Chinese', (trigger, expected) => {
    const markup = renderToStaticMarkup(
      <ModuleRuleText definition={module({ trigger })} cooldownRemaining={1} />,
    );

    expect(markup).toContain(expected);
  });

  it.each([
    ['SELF', '自身（永遠可用）'],
    ['ADJACENT', '正交相鄰格；需至少一個可用模組'],
    ['LEFT', '左側格；需至少一個可用模組'],
    ['RIGHT', '右側格；需至少一個可用模組'],
    ['ROW', '同列其他格；需至少一個可用模組'],
    ['ALL', '所有其他格；需至少一個可用模組'],
  ] as const)('explains the exact %s target gate in Chinese', (target, expected) => {
    const markup = renderToStaticMarkup(
      <ModuleRuleText definition={module({ target })} cooldownRemaining={1} />,
    );

    expect(markup).toContain(expected);
  });

  it('shows the canonical remaining cooldown and base cooldown rule', () => {
    const markup = renderToStaticMarkup(
      <ModuleRuleText definition={module({ cooldown: 2 })} cooldownRemaining={1} />,
    );

    expect(markup).toContain('目前還需等待 1 回合');
    expect(markup).toContain('啟動後跳過接下來 2 回合');
  });
});
