import type { GameGenome, GenomeCounter, ModuleRoleId, ThreatModifierId } from './game-genome';

export type ModuleLevel = 1 | 2;
export type SystemBreakerStatus = 'PREPARE' | 'VICTORY' | 'DEFEAT';

export interface ModuleInstance {
  instanceId: string;
  definitionId: string;
  level: ModuleLevel;
}

export interface BoardCell {
  index: number;
  blocked: boolean;
  locked: boolean;
  module?: ModuleInstance;
}

export interface SystemBoard {
  size: 2 | 3;
  cells: BoardCell[];
}

export interface ShopOffer {
  offerId: string;
  definitionId: string;
  price: number;
}

export interface SystemShop {
  offers: Array<ShopOffer | null>;
  refreshesRemaining: number;
}

export interface SystemFragment {
  version: 1;
  moduleId: string;
  name: string;
  bonus: number;
}

export interface SystemBreakerRun {
  genome: GameGenome;
  seed: string;
  round: number;
  status: SystemBreakerStatus;
  resources: {
    PROGRESS: number;
    INTEGRITY: number;
    INSTABILITY: number;
    CREDITS: number;
  };
  board: SystemBoard;
  inventory: ModuleInstance[];
  shop: SystemShop;
  activeModifier: ThreatModifierId;
  activeCounter: GenomeCounter | null;
  savedFragment?: SystemFragment;
  fragment?: SystemFragment;
  completedThreats: number;
  score: number;
  bestChain: number;
  nextInstanceId: number;
  chainLog: ChainEvent[];
}

export type BoardCommand =
  | { type: 'BUY'; offerIndex: number }
  | { type: 'SELL'; instanceId: string }
  | { type: 'PLACE'; instanceId: string; cellIndex: number }
  | { type: 'FUSE'; sourceInstanceId: string; targetInstanceId: string }
  | { type: 'REFRESH' };

export type BoardCommandFailure =
  | 'RUN_FINISHED'
  | 'OFFER_UNAVAILABLE'
  | 'INSUFFICIENT_CREDITS'
  | 'INSTANCE_NOT_FOUND'
  | 'CELL_NOT_FOUND'
  | 'CELL_BLOCKED'
  | 'CELL_OCCUPIED'
  | 'FUSION_INVALID'
  | 'REFRESH_UNAVAILABLE';

export interface CommandResult {
  accepted: boolean;
  run: SystemBreakerRun;
  reason?: BoardCommandFailure;
}

export type ChainEventType =
  | 'MODULE_TRIGGERED'
  | 'RESOURCE_CHANGED'
  | 'MODULE_LOCKED'
  | 'THREAT_DEFEATED'
  | 'THREAT_HIT'
  | 'BOSS_PHASE_TWO'
  | 'MODULE_REVIVED'
  | 'CHAIN_LIMIT_REACHED';

export interface ChainEvent {
  sequence: number;
  type: ChainEventType;
  message: string;
  moduleInstanceId?: string;
  role?: ModuleRoleId;
  value?: number;
}

export interface RoundResult {
  run: SystemBreakerRun;
  events: ChainEvent[];
  success: boolean;
}
