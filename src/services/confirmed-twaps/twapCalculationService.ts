import { ConfirmedTWAPsDatabaseService } from "./databaseService";
import { TWAPState, TWAPWindowType } from "../../shared/types";
import { demoBlocks } from "../../shared/demoData";

export interface TWAPCalculationResult {
  twapValue: number;
  weightedSum: number;
  totalSeconds: number;
}

export class ConfirmedTWAPsCalculationService {
  private dbService: ConfirmedTWAPsDatabaseService;

  constructor(dbService: ConfirmedTWAPsDatabaseService) {
    this.dbService = dbService;
  }

  async calculateTWAP(
    windowType: TWAPWindowType,
    currentTimestamp: number,
    duration: number
  ): Promise<TWAPCalculationResult> {
    const existingState = await this.dbService.getTWAPState(windowType);
    
    if (existingState) {
      return this.calculateIncrementalTWAP(existingState, currentTimestamp, duration);
    } else {
      return this.calculateInitialTWAP(currentTimestamp, duration);
    }
  }

  private async calculateIncrementalTWAP(
    existingState: TWAPState,
    currentTimestamp: number,
    duration: number
  ): Promise<TWAPCalculationResult> {
    const startTimestamp = currentTimestamp - duration;
    const endTimestamp = currentTimestamp;

    // Get new blocks from Fossil
    const newBlocks = await this.dbService.getFossilBlocks(startTimestamp, endTimestamp);
    
    if (newBlocks.length === 0) {
      return {
        twapValue: existingState.twapValue,
        weightedSum: existingState.weightedSum,
        totalSeconds: existingState.totalSeconds,
      };
    }

    // Calculate weighted sum for new blocks
    let newWeightedSum = 0;
    let newTotalSeconds = 0;

    for (let i = 0; i < newBlocks.length; i++) {
      const block = newBlocks[i];
      const nextBlock = newBlocks[i + 1];
      
      const blockDuration = nextBlock 
        ? nextBlock.timestamp - block.timestamp 
        : 12; // Default block time if no next block

      newWeightedSum += Number(block.basefee) * blockDuration;
      newTotalSeconds += blockDuration;
    }

    // Combine with existing state
    const totalWeightedSum = existingState.weightedSum + newWeightedSum;
    const totalSeconds = existingState.totalSeconds + newTotalSeconds;
    const twapValue = totalSeconds > 0 ? totalWeightedSum / totalSeconds : 0;

    return {
      twapValue,
      weightedSum: totalWeightedSum,
      totalSeconds,
    };
  }

  private async calculateInitialTWAP(
    currentTimestamp: number,
    duration: number
  ): Promise<TWAPCalculationResult> {
    const startTimestamp = currentTimestamp - duration;
    const endTimestamp = currentTimestamp;

    // Get blocks from Fossil
    const blocks = await this.dbService.getFossilBlocks(startTimestamp, endTimestamp);
    
    if (blocks.length === 0) {
      return {
        twapValue: 0,
        weightedSum: 0,
        totalSeconds: 0,
      };
    }

    // Calculate weighted sum
    let weightedSum = 0;
    let totalSeconds = 0;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const nextBlock = blocks[i + 1];
      
      const blockDuration = nextBlock 
        ? nextBlock.timestamp - block.timestamp 
        : 12; // Default block time if no next block

      weightedSum += Number(block.basefee) * blockDuration;
      totalSeconds += blockDuration;
    }

    const twapValue = totalSeconds > 0 ? weightedSum / totalSeconds : 0;

    return {
      twapValue,
      weightedSum,
      totalSeconds,
    };
  }

  async updateAllTWAPs(currentTimestamp: number): Promise<void> {
    const windowConfigs = [
      {
        type: "twelve_min" as TWAPWindowType,
        duration: 12 * 60,
      },
      {
        type: "three_hour" as TWAPWindowType,
        duration: 3 * 60 * 60,
      },
      {
        type: "thirty_day" as TWAPWindowType,
        duration: 30 * 24 * 60 * 60,
      },
    ];

    for (const config of windowConfigs) {
      const result = await this.calculateTWAP(config.type, currentTimestamp, config.duration);
      
      await this.dbService.saveTWAPState(config.type, {
        weightedSum: result.weightedSum,
        totalSeconds: result.totalSeconds,
        twapValue: result.twapValue,
        lastBlockNumber: 0, // Will be updated when we have block numbers
        lastBlockTimestamp: currentTimestamp,
      });
    }
  }
} 