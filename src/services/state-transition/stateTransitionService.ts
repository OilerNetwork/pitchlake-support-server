import { Logger } from "winston";
import { StateTransitionConfig, loadStateTransitionConfig } from "./config";
import { StarkNetClient } from "./starknetClient";
import { FossilApiService } from "./fossilApiService";
import { StateHandler } from "./stateHandler";

export class StateTransitionService {
  private logger: Logger;
  private config: StateTransitionConfig;
  private starknetClient: StarkNetClient;
  private fossilApiService: FossilApiService;
  private stateHandler: StateHandler;
  private vaultAddress: string;

  constructor(
    vaultAddress: string,
    logger: Logger
  ) {
    this.vaultAddress = vaultAddress;
    this.logger = logger;
    this.config = loadStateTransitionConfig();
    this.starknetClient = new StarkNetClient(this.config);
    this.fossilApiService = new FossilApiService(this.config);
    this.stateHandler = new StateHandler(this.starknetClient, this.fossilApiService, logger);
  }

  getVaultAddress(): string {
    return this.vaultAddress;
  }

  async checkAndTransition(): Promise<void> {
    try {
      const vaultContract = this.starknetClient.createVaultContract(this.vaultAddress);
      
      // Get round information
      const roundInfo = await this.starknetClient.getRoundInfo(vaultContract);
      this.logger.info(`Checking round ${roundInfo.roundId} at ${roundInfo.roundAddressHex}`);
      this.logger.info(`Current state: ${roundInfo.state}`);

      // Get latest block timestamp
      const latestBlockTimestamp = await this.starknetClient.getLatestBlockTimestamp();
      this.logger.debug(`Using block timestamp: ${latestBlockTimestamp}`);

      // Create round contract
      const roundContract = this.starknetClient.createRoundContract(roundInfo.roundAddressHex);

      // Handle the current state
      await this.stateHandler.handleState(
        roundInfo.state,
        roundContract,
        vaultContract,
        latestBlockTimestamp
      );
    } catch (error) {
      this.logger.error("Error in checkAndTransition:", error);
      throw error;
    }
  }
} 