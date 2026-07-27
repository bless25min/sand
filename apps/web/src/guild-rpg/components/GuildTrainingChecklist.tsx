import type { FirstHuntCoachStep } from '../onboarding/first-hunt-coach';
import type { GuildRpgState } from '../state/game-reducer';

const TRAINING = [
  { step: 'equip_loot', label: '穿上第一件屬性裝備' },
  { step: 'forge_loot', label: '校準一次裝備核心' },
  { step: 'inspect_skills', label: '打開六格技能配置' },
  { step: 'fuse_skill', label: '融合兩張同屬性技能' },
  { step: 'equip_fused', label: '裝備剛完成的融合技' },
  { step: 'replay', label: '帶新組合重刷第一關' },
] as const satisfies readonly { step: FirstHuntCoachStep; label: string }[];

export function GuildTrainingChecklist({ state }: { state: GuildRpgState }) {
  if (state.preferences.tutorial !== 'active') return null;
  const activeIndex = TRAINING.findIndex(({ step }) => step === state.tutorialStep);
  if (activeIndex < 0) return null;
  return (
    <section
      className="gr-training-checklist"
      aria-label="公會訓練清單"
      data-training-active={state.tutorialStep}
    >
      <header>
        <div>
          <span>勝利後整備訓練</span>
          <strong>一次只做一件事</strong>
        </div>
        <b>
          {activeIndex + 1} / {TRAINING.length}
        </b>
      </header>
      <ol>
        {TRAINING.map((item, index) => (
          <li
            data-active={index === activeIndex}
            data-complete={index < activeIndex}
            key={item.step}
          >
            <span>{index < activeIndex ? '✓' : index + 1}</span>
            <small>{item.label}</small>
          </li>
        ))}
      </ol>
    </section>
  );
}
