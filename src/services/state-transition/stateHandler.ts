import { Contract } from "starknet";
import { Logger } from "winston";
import { OptionRoundState } from "../../shared/types";
import { StarkNetClient } from "./starknetClient";
import { FossilApiService } from "./fossilApiService";

export class StateHandler {
  private logger: Logger;
  private starknetClient: StarkNetClient;
  private fossilApiService: FossilApiService;

  constructor(
    starknetClient: StarkNetClient,
    fossilApiService: FossilApiService,
    logger: Logger
  ) {
    this.logger = logger;
    this.starknetClient = starknetClient;
    this.fossilApiService = fossilApiService;
  }

  private formatTimeLeft(current: number, target: number): string {
    const secondsLeft = Number(target) - Number(current);
    const hoursLeft = secondsLeft / 3600;
    return `${secondsLeft} seconds (${hoursLeft.toFixed(2)} hrs)`;
  }

  async handleOpenState(
    roundContract: Contract,
    vaultContract: Contract,
    latestBlockTimestamp: number
  ): Promise<void> {
    try {
      // Check if this is the first round that needs initialization
      const reservePrice = await roundContract.get_reserve_price();
      
      if (reservePrice === 0n) {
        this.logger.info("First round detected - needs initialization");
        const requestData = await vaultContract.get_request_to_start_first_round();
        
        // Format request data for timestamp check
        const requestTimestamp = Number(requestData[1]);
        
        // Check if Fossil has required blocks before proceeding
        if (!await this.fossilApiService.checkFossilBlocks(requestTimestamp)) {
          this.logger.info(`Fossil blocks haven't reached the request timestamp yet`);
          return;
        }
        
        // Initialize first round
        const fossilRequest = this.fossilApiService.formatRawToFossilRequest(requestData);
        await this.fossilApiService.sendPricingDataRequest(vaultContract, fossilRequest);

        // The fossil request takes some time to process, so we'll exit here
        // and let the cron handle the state transition in the next iteration
        return;
      }

      // Existing auction start logic
      const auctionStartTime = Number(await roundContract.get_auction_start_date());
      
      if (latestBlockTimestamp < auctionStartTime) {
        this.logger.info(`Waiting for auction start time. Time left: ${this.formatTimeLeft(latestBlockTimestamp, auctionStartTime)}`);
        return;
      }

      this.logger.info("Starting auction...");
      
      const estimatedMaxFee = await this.starknetClient.estimateTransactionFee(
        vaultContract.address,
        'start_auction'
      );

      const { transaction_hash } = await vaultContract.start_auction({ maxFee: estimatedMaxFee * 2n });
      await this.starknetClient.waitForTransaction(transaction_hash);
      
      this.logger.info("Auction started successfully", {
        transactionHash: transaction_hash
      });
    } catch (error) {
      this.logger.error("Error handling Open state:", error);
      throw error;
    }
  }

  async handleAuctioningState(
    roundContract: Contract,
    vaultContract: Contract,
    latestBlockTimestamp: number
  ): Promise<void> {
    try {
      const auctionEndTime = Number(await roundContract.get_auction_end_date());
      
      if (latestBlockTimestamp < auctionEndTime) {
        this.logger.info(`Waiting for auction end time. Time left: ${this.formatTimeLeft(latestBlockTimestamp, auctionEndTime)}`);
        return;
      }

      this.logger.info("Ending auction...");
    
      const estimatedMaxFee = await this.starknetClient.estimateTransactionFee(
        vaultContract.address,
        'end_auction'
      );

      const { transaction_hash } = await vaultContract.end_auction({ maxFee: estimatedMaxFee * 2n });
      await this.starknetClient.waitForTransaction(transaction_hash);
      
      this.logger.info("Auction ended successfully", {
        transactionHash: transaction_hash
      });
    } catch (error) {
      this.logger.error("Error handling Auctioning state:", error);
      throw error;
    }
  }

  async handleRunningState(
    roundContract: Contract,
    vaultContract: Contract,
    latestBlockTimestamp: number
  ): Promise<void> {
    try {
      const settlementTime = Number(await roundContract.get_option_settlement_date());
      
      if (latestBlockTimestamp < settlementTime) {
        this.logger.info(`Waiting for settlement time. Time left: ${this.formatTimeLeft(latestBlockTimestamp, settlementTime)}`);
        return;
      }

      this.logger.info("Settlement time reached");
      
      const rawRequestData = await vaultContract.get_request_to_settle_round();
      const requestData = this.fossilApiService.formatRawToFossilRequest(rawRequestData);
      
      // Check if Fossil has required blocks before proceeding
      if (!await this.fossilApiService.checkFossilBlocks(Number(requestData.timestamp))) {
        this.logger.info(`Fossil blocks haven't reached the request timestamp yet`);
        return;
      }

      await this.fossilApiService.sendPricingDataRequest(vaultContract, requestData);
    } catch (error) {
      this.logger.error("Error handling Running state:", error);
      throw error;
    }
  }

  async handleState(
    state: OptionRoundState,
    roundContract: Contract,
    vaultContract: Contract,
    latestBlockTimestamp: number
  ): Promise<void> {
    switch (state) {
      case OptionRoundState.Open:
        await this.handleOpenState(roundContract, vaultContract, latestBlockTimestamp);
        break;
        
      case OptionRoundState.Auctioning:
        await this.handleAuctioningState(roundContract, vaultContract, latestBlockTimestamp);
        break;
        
      case OptionRoundState.Running:
        await this.handleRunningState(roundContract, vaultContract, latestBlockTimestamp);
        break;
        
      case OptionRoundState.Settled:
        this.logger.info("Round is settled - no actions possible");
        break;
    }
  }
} 