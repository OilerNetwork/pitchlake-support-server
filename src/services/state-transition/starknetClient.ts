import { 
  Contract, 
  RpcProvider, 
  Account,
  CairoCustomEnum,
} from "starknet";
import { ABI as VaultAbi } from "../../abi/vault";
import { ABI as OptionRoundAbi } from "../../abi/optionRound";
import { StateTransitionConfig } from "./config";
import { OptionRoundState } from "../../shared/types";

export interface RoundInfo {
  roundId: bigint;
  roundAddress: string;
  roundAddressHex: string;
  state: OptionRoundState;
}

export class StarkNetClient {
  private provider: RpcProvider;
  private account: Account;
  private config: StateTransitionConfig;

  constructor(config: StateTransitionConfig) {
    this.config = config;
    this.provider = new RpcProvider({ nodeUrl: config.starknetRpcUrl });
    this.account = new Account(
      this.provider,
      config.starknetAccountAddress,
      config.starknetPrivateKey
    );
  }

  getProvider(): RpcProvider {
    return this.provider;
  }

  getAccount(): Account {
    return this.account;
  }

  createVaultContract(vaultAddress: string): Contract {
    return new Contract(
      VaultAbi,
      vaultAddress,
      this.account
    );
  }

  createRoundContract(roundAddressHex: string): Contract {
    return new Contract(
      OptionRoundAbi,
      roundAddressHex,
      this.account
    );
  }

  async getLatestBlockTimestamp(): Promise<number> {
    const latestBlock = await this.provider.getBlock('latest');
    return Number(latestBlock.timestamp);
  }

  async getRoundInfo(vaultContract: Contract): Promise<RoundInfo> {
    const roundId = await vaultContract.get_current_round_id();
    const roundAddress = await vaultContract.get_round_address(roundId);

    // Convert decimal address to hex
    const roundAddressHex = "0x" + BigInt(roundAddress).toString(16);
    
    const roundContract = this.createRoundContract(roundAddressHex);
    const stateRaw = await roundContract.get_state();
    const state = (stateRaw as CairoCustomEnum).activeVariant();
    const stateEnum = OptionRoundState[state as keyof typeof OptionRoundState];

    return {
      roundId,
      roundAddress: roundAddress.toString(),
      roundAddressHex,
      state: stateEnum
    };
  }

  async estimateTransactionFee(
    contractAddress: string,
    entrypoint: string,
    calldata: any[] = []
  ): Promise<bigint> {
    const { suggestedMaxFee } = await this.account.estimateInvokeFee({
      contractAddress,
      entrypoint,
      calldata,
    });
    return suggestedMaxFee;
  }

  async waitForTransaction(transactionHash: string): Promise<void> {
    await this.provider.waitForTransaction(transactionHash);
  }
} 