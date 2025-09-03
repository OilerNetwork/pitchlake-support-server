import { createPublicClient, http, PublicClient } from "viem";
import { mainnet } from "viem/chains";
import { RPCConfig } from "../shared/types";

export class RPCClient {
  private client: PublicClient;

  constructor(config: RPCConfig) {
    this.client = createPublicClient({
      chain: mainnet,
      transport: http(config.mainnetRpcUrl),
    });
  }

  getClient(): PublicClient {
    return this.client;
  }

  async getBlockNumber(): Promise<bigint> {
    return this.client.getBlockNumber();
  }

  async getBlock(blockNumber: bigint) {
    return this.client.getBlock({ blockNumber });
  }

  async getBlocks(fromBlock: number, length: number) {
    const promises = Array.from({ length }, async (_, i) => {
      const block = await this.client.getBlock({
        blockNumber: BigInt(fromBlock + i),
      });
      return block;
    });
    const blocks = await Promise.all(promises);
    blocks.sort((a, b) => Number(a.number) - Number(b.number));
    return blocks;
  }
} 