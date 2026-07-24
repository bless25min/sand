import type { GameModuleDefinition } from '@expedition/shared-types';

const triggerText: Record<GameModuleDefinition['trigger'], string> = {
  ROUND_START: '每回合第一階段開始時',
  FIXED_TIME: '每回合第二階段時',
  DAMAGED: '前一回合完整度受損時',
  DISABLED: '自身格被封鎖或鎖定時',
  ADJACENT_TRIGGER: '正交相鄰模組已啟動後',
  RESOURCE_THRESHOLD: '進度達當前目標一半，或不穩定度達 50 時',
};

const targetText: Record<GameModuleDefinition['target'], string> = {
  SELF: '自身（永遠可用）',
  ADJACENT: '正交相鄰格；需至少一個可用模組',
  LEFT: '左側格；需至少一個可用模組',
  RIGHT: '右側格；需至少一個可用模組',
  ROW: '同列其他格；需至少一個可用模組',
  ALL: '所有其他格；需至少一個可用模組',
};

export function ModuleRuleText(props: {
  definition: GameModuleDefinition;
  cooldownRemaining?: number;
}) {
  const cooldown =
    props.cooldownRemaining === undefined
      ? '尚未部署'
      : `目前還需等待 ${props.cooldownRemaining} 回合`;
  const baseCooldown =
    props.definition.cooldown === 0
      ? '啟動後不跳過回合'
      : `啟動後跳過接下來 ${props.definition.cooldown} 回合`;

  return (
    <span className="sb-module-rules">
      <span>觸發：{triggerText[props.definition.trigger]}</span>
      <span>目標：{targetText[props.definition.target]}</span>
      <span>
        冷卻：{cooldown}；{baseCooldown}
      </span>
    </span>
  );
}
