export type MatchmakingKey = string;

export interface MatchmakingEntry {
  roomId: string;
  userId: string;
  socketId: string;
  stake: number;
  gameType: string;
  createdAt: number;
}

export class MatchmakingService {
  private queue = new Map<MatchmakingKey, MatchmakingEntry[]>();

  private makeKey(gameType: string, stake: number) {
    return `${gameType}:${stake}`;
  }

  enqueue(entry: MatchmakingEntry) {
    const key = this.makeKey(entry.gameType, entry.stake);
    const list = this.queue.get(key) ?? [];
    list.push(entry);
    this.queue.set(key, list);
  }

  dequeueMatch(gameType: string, stake: number) {
    const key = this.makeKey(gameType, stake);
    const list = this.queue.get(key) ?? [];
    const entry = list.shift();
    if (list.length == 0) this.queue.delete(key);
    else this.queue.set(key, list);
    return entry ?? null;
  }

  removeBySocket(socketId: string) {
    for (const [key, list] of this.queue.entries()) {
      const next = list.filter((item) => item.socketId !== socketId);
      if (next.length == 0) this.queue.delete(key);
      else this.queue.set(key, next);
    }
  }

  snapshot() {
    return Array.from(this.queue.values()).flat();
  }
}
