export type Network = "USDT" | "ETH" | "POLYGON";

export interface DepositAddress {
  network: Network;
  address: string;
}

export interface WithdrawRequest {
  network: Network;
  address: string;
  amount: number;
}

export interface CryptoAdapter {
  network: Network;
  createDepositAddress(userId: string): Promise<DepositAddress>;
  requestWithdraw(withdraw: WithdrawRequest): Promise<{ id: string; status: "queued" | "failed" }>;
}

export class MockAdapter implements CryptoAdapter {
  constructor(public network: Network) {}

  async createDepositAddress(userId: string): Promise<DepositAddress> {
    const address = `mock_${this.network.toLowerCase()}_${userId.slice(0, 6)}`;
    return { network: this.network, address };
  }

  async requestWithdraw(withdraw: WithdrawRequest) {
    return { id: `${withdraw.network}-${Date.now()}`, status: "queued" } as const;
  }
}

export class CryptoRouter {
  private adapters = new Map<Network, CryptoAdapter>();

  register(adapter: CryptoAdapter) {
    this.adapters.set(adapter.network, adapter);
  }

  getAdapter(network: Network) {
    const adapter = this.adapters.get(network);
    if (!adapter) throw new Error(`Unsupported network: ${network}`);
    return adapter;
  }
}

export class DepositListener {
  constructor(private onDeposit: (userId: string, amount: number, metadata?: Record<string, unknown>) => Promise<void>) {}

  async start() {
    // TODO: connect to chain listeners
    return true;
  }
}

export class WithdrawQueue {
  private queue: WithdrawRequest[] = [];

  enqueue(request: WithdrawRequest) {
    this.queue.push(request);
  }

  dequeue() {
    return this.queue.shift();
  }
}
