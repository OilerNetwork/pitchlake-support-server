import { Contract, RpcProvider, Account } from "starknet";
import { ABI as VaultAbi } from "../../abi/vault";
import { ABI as OptionRoundAbi } from "../../abi/optionRound";
import { StateTransitionConfig } from "@/types/types";


export interface RoundInfo {
  roundId: number;
  roundAddressHex: string;
  state: number;
}

export class StarkNetClient {
  private provider: RpcProvider;
  private account: Account;

  constructor(config: StateTransitionConfig) {
    this.provider = new RpcProvider({ nodeUrl: config.starknetRpcUrl });
    this.account = new Account(
      this.provider,
      config.starknetAccountAddress,
      config.starknetPrivateKey
    );
  }

  createVaultContract(vaultAddress: string): Contract {
    return new Contract(VaultAbi, vaultAddress, this.provider);
  }

  createRoundContract(roundAddress: string): Contract {
    return new Contract(OptionRoundAbi, roundAddress, this.provider);
  }

  async getRoundInfo(vaultContract: Contract): Promise<RoundInfo> {
    try {
      // Get current round ID from vault
      const roundId = await vaultContract.get_current_round_id();
      
      // Get round address from vault using the round ID
      const roundAddress = await vaultContract.get_round_address(roundId);
      
      // Create round contract to get the state
      const roundContract = this.createRoundContract(roundAddress);
      const state = await roundContract.get_state();

      return {
        roundId: Number(roundId),
        roundAddressHex: roundAddress,
        state: Number(state)
      };
    } catch (error) {
      throw new Error(`Failed to get round info: ${error}`);
    }
  }

  async getLatestBlockTimestamp(): Promise<number> {
    try {
      const block = await this.provider.getBlock("latest");
      return block.timestamp;
    } catch (error) {
      throw new Error(`Failed to get latest block timestamp: ${error}`);
    }
  }

  async estimateTransactionFee(
    contractAddress: string,
    functionName: string,
    calldata: any[] = []
  ): Promise<bigint> {
    try {
      const { suggestedMaxFee } = await this.account.estimateInvokeFee({
        contractAddress,
        entrypoint: functionName,
        calldata
      });
      return BigInt(suggestedMaxFee);
    } catch (error) {
      throw new Error(`Failed to estimate transaction fee: ${error}`);
    }
  }

  async waitForTransaction(transactionHash: string): Promise<void> {
    try {
      await this.provider.waitForTransaction(transactionHash);
    } catch (error) {
      throw new Error(`Failed to wait for transaction ${transactionHash}: ${error}`);
    }
  }
} 