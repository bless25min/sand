import type { ComboEvent, GuildBattleState, HuntDefinition } from '@expedition/shared-types';

export interface BossPhaseInput {
  battle: GuildBattleState;
  hunt?: HuntDefinition | undefined;
}

function latestActivatorDefeat(events: readonly ComboEvent[], activatorIds: ReadonlySet<string>) {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index]!;
    if (event.kind === 'unit_defeated' && event.targetId && activatorIds.has(event.targetId)) {
      return event;
    }
  }
  return undefined;
}

export function resolveBossPhase({ battle, hunt }: BossPhaseInput): GuildBattleState {
  if (!battle.combo || !hunt?.bossPhases?.length) return battle;
  const activated = new Set(battle.combo.activatedBossPhaseIds ?? []);

  for (const phase of hunt.bossPhases) {
    if (activated.has(phase.id)) continue;
    const boss = battle.units.find(
      (unit) => unit.id === phase.bossEnemyId && unit.side === 'enemies',
    );
    if (!boss || boss.currentHp <= 0) continue;
    const ready = phase.activateAfterEnemyIds.every(
      (enemyId) =>
        battle.units.find((unit) => unit.id === enemyId && unit.side === 'enemies')?.currentHp ===
        0,
    );
    if (!ready) continue;

    const parent = latestActivatorDefeat(battle.combo.events, new Set(phase.activateAfterEnemyIds));
    const event: ComboEvent = {
      id: battle.combo.events.length,
      causalId: `boss-phase:${phase.id}`,
      ...(parent ? { parentCausalId: parent.causalId } : {}),
      kind: 'boss_phase',
      message: phase.pressureLabel,
      targetId: phase.bossEnemyId,
      phaseId: phase.id,
      cueId: phase.cueId,
    };
    return {
      ...battle,
      selectedTargetId: phase.bossEnemyId,
      combo: {
        ...battle.combo,
        activatedBossPhaseIds: [...activated, phase.id],
        events: [...battle.combo.events, event],
      },
    };
  }

  return battle;
}
