type EventMap = { [key: string]: unknown };

type Handler<T> = (payload: T) => void;

export class EventBus<Events extends EventMap> {
  private handlers = new Map<keyof Events, Set<Handler<never>>>();

  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    const set = this.handlers.get(event)!;
    set.add(handler as Handler<never>);
    return () => set.delete(handler as Handler<never>);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.handlers.get(event)?.forEach((handler) => {
      (handler as Handler<Events[K]>)(payload);
    });
  }

  off<K extends keyof Events>(event: K, handler: Handler<Events[K]>): void {
    this.handlers.get(event)?.delete(handler as Handler<never>);
  }

  clear(): void {
    this.handlers.clear();
  }
}

export type GameEvents = {
  [key: string]: unknown;
  'game:stateChange': { state: import('@/types/game').GameState };
  'goal:reached': import('@/types/game').GoalEvent;
  'game:finished': { winners: import('@/types/game').GoalEvent[] };
  'marble:switch': { idA: number; idB: number; nameA: string; nameB: string };
  'obstacle:spawn': import('@/types/game').ObstacleEvent;
  'obstacle:remove': { id: string };
};

export const gameEvents = new EventBus<GameEvents>();
