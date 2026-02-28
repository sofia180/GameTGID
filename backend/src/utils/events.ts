import { EventEmitter } from 'events';

export const eventBus = new EventEmitter();

export type EventPayloads = {
  'match:created': { tournamentId: number; matchId: number };
  'match:updated': { tournamentId: number; matchId: number; winnerId?: number };
  'tournament:updated': { tournamentId: number; status: string };
};

export function emitEvent<K extends keyof EventPayloads>(key: K, payload: EventPayloads[K]) {
  eventBus.emit(key, payload);
}
