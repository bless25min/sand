import type { MaterialId } from './material-id';

export interface MaterialDefinition {
  readonly id: MaterialId;
  readonly name: string;
  readonly unitWeight: number;
  readonly tags: readonly string[];
}
