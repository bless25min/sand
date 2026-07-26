export interface SkillTriggerQueueEvent {
  kind: 'triggered' | 'infinite_engine';
  source: string;
}

export function resolveSkillTriggerQueue(
  initialSources: readonly string[],
  graph: Readonly<Record<string, readonly string[]>>,
): { events: readonly SkillTriggerQueueEvent[]; infiniteEngine: boolean } {
  const queue = [...initialSources];
  const visited = new Set<string>();
  const events: SkillTriggerQueueEvent[] = [];

  while (queue.length > 0) {
    const source = queue.shift()!;
    if (visited.has(source)) {
      events.push({ kind: 'infinite_engine', source });
      return { events, infiniteEngine: true };
    }
    visited.add(source);
    events.push({ kind: 'triggered', source });
    queue.push(...(graph[source] ?? []));
  }

  return { events, infiniteEngine: false };
}
