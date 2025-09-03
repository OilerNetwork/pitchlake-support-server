import { ConfirmedTWAPsConfig, loadConfirmedTWAPsConfig } from "./config";
import { ConfirmedTWAPsDatabaseService } from "./databaseService";
import { ConfirmedTWAPsCalculationService } from "./twapCalculationService";

export class ConfirmedTWAPsService {
  private config: ConfirmedTWAPsConfig;
  private dbService: ConfirmedTWAPsDatabaseService;
  private calculationService: ConfirmedTWAPsCalculationService;

  constructor() {
    this.config = loadConfirmedTWAPsConfig();
    this.dbService = new ConfirmedTWAPsDatabaseService(this.config);
    this.calculationService = new ConfirmedTWAPsCalculationService(this.dbService);
  }

  async initialize(): Promise<void> {
    await this.dbService.initialize();
  }

  async updateTWAPs(currentTimestamp: number): Promise<void> {
    try {
      await this.calculationService.updateAllTWAPs(currentTimestamp);
      console.log(`Updated all confirmed TWAPs at timestamp: ${currentTimestamp}`);
    } catch (error) {
      console.error('Error updating confirmed TWAPs:', error);
      throw error;
    }
  }

  async getTWAPState(windowType: string): Promise<any> {
    try {
      return await this.dbService.getTWAPState(windowType as any);
    } catch (error) {
      console.error(`Error getting TWAP state for ${windowType}:`, error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    await this.dbService.shutdown();
  }

  // Demo data methods for testing
  getDemoData() {
    if (this.config.useDemoData) {
      return {
        twapRanges: this.config.twapRanges,
        useDemoData: true
      };
    }
    return null;
  }
} 