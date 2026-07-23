import type {
  BoardCommand,
  BoardCommandFailure,
  CommandResult,
  ModuleInstance,
  SystemBreakerRun,
} from '@expedition/shared-types';

import { createRoundOffers } from '../run/create-round-offer';

const rejected = (run: SystemBreakerRun, reason: BoardCommandFailure): CommandResult => ({
  accepted: false,
  run,
  reason,
});

function removeInstance(run: SystemBreakerRun, instanceId: string): void {
  run.inventory = run.inventory.filter((module) => module.instanceId !== instanceId);
  run.board.cells = run.board.cells.map((cell) => {
    if (cell.module?.instanceId !== instanceId) return cell;
    const emptyCell = { ...cell };
    delete emptyCell.module;
    return emptyCell;
  });
}

function findInstance(run: SystemBreakerRun, instanceId: string): ModuleInstance | undefined {
  return (
    run.inventory.find((module) => module.instanceId === instanceId) ??
    run.board.cells.find((cell) => cell.module?.instanceId === instanceId)?.module
  );
}

export function applyBoardCommand(run: SystemBreakerRun, command: BoardCommand): CommandResult {
  if (run.status !== 'PREPARE') return rejected(run, 'RUN_FINISHED');
  const next: SystemBreakerRun = {
    ...run,
    resources: { ...run.resources },
    board: {
      ...run.board,
      cells: run.board.cells.map((cell) => ({
        ...cell,
        ...(cell.module ? { module: { ...cell.module } } : {}),
      })),
    },
    inventory: run.inventory.map((module) => ({ ...module })),
    shop: {
      ...run.shop,
      offers: run.shop.offers.map((offer) => (offer ? { ...offer } : null)),
    },
    chainLog: run.chainLog.map((event) => ({ ...event })),
    ...(run.activeCounter ? { activeCounter: { ...run.activeCounter } } : {}),
  };

  if (command.type === 'BUY') {
    const offer = next.shop.offers[command.offerIndex];
    if (!offer) return rejected(run, 'OFFER_UNAVAILABLE');
    if (next.resources.CREDITS < offer.price) return rejected(run, 'INSUFFICIENT_CREDITS');
    next.resources.CREDITS -= offer.price;
    next.inventory.push({
      instanceId: `module-instance-${next.nextInstanceId}`,
      definitionId: offer.definitionId,
      level: 1,
    });
    next.nextInstanceId += 1;
    next.shop.offers[command.offerIndex] = null;
    return { accepted: true, run: next };
  }

  if (command.type === 'PLACE') {
    const instance = findInstance(next, command.instanceId);
    if (!instance) return rejected(run, 'INSTANCE_NOT_FOUND');
    const target = next.board.cells[command.cellIndex];
    if (!target) return rejected(run, 'CELL_NOT_FOUND');
    if (target.blocked || target.locked) return rejected(run, 'CELL_BLOCKED');
    if (target.module?.instanceId !== instance.instanceId && target.module)
      return rejected(run, 'CELL_OCCUPIED');
    removeInstance(next, instance.instanceId);
    next.board.cells[command.cellIndex] = { ...target, module: instance };
    return { accepted: true, run: next };
  }

  if (command.type === 'SELL') {
    const instance = findInstance(next, command.instanceId);
    if (!instance) return rejected(run, 'INSTANCE_NOT_FOUND');
    const definition = next.genome.modules.find((module) => module.id === instance.definitionId)!;
    next.resources.CREDITS += Math.floor((definition.cost * instance.level) / 2);
    removeInstance(next, instance.instanceId);
    return { accepted: true, run: next };
  }

  if (command.type === 'FUSE') {
    const source = findInstance(next, command.sourceInstanceId);
    const target = findInstance(next, command.targetInstanceId);
    if (
      !source ||
      !target ||
      source.instanceId === target.instanceId ||
      source.definitionId !== target.definitionId ||
      source.level !== target.level ||
      target.level !== 1
    )
      return rejected(run, 'FUSION_INVALID');
    removeInstance(next, source.instanceId);
    target.level = 2;
    return { accepted: true, run: next };
  }

  if (next.shop.refreshesRemaining < 1 || next.resources.CREDITS < 2)
    return rejected(run, 'REFRESH_UNAVAILABLE');
  next.resources.CREDITS -= 2;
  next.shop.refreshesRemaining -= 1;
  next.shop.offers = createRoundOffers({
    genome: next.genome,
    round: next.round,
    refresh: 1,
    board: next.board,
    inventory: next.inventory,
  });
  return { accepted: true, run: next };
}
