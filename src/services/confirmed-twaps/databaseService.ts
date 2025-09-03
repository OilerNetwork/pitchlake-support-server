import { Client } from "pg";
import { ConfirmedTWAPsConfig } from "./config";
import { TWAPState, TWAPWindowType } from "../../shared/types";

export class ConfirmedTWAPsDatabaseService {
  private fossilClient?: Client;
  private pitchlakeClient?: Client;
  private config: ConfirmedTWAPsConfig;

  constructor(config: ConfirmedTWAPsConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.config.useDemoData) {
      return;
    }

    await this.createClients();
  }

  private async createClients(): Promise<void> {
    this.fossilClient = new Client({
      connectionString: this.config.fossilDbConnectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    this.pitchlakeClient = new Client({
      connectionString: this.config.pitchlakeDbConnectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });

    await this.fossilClient.connect();
    await this.pitchlakeClient.connect();
  }

  async getTWAPState(windowType: TWAPWindowType): Promise<TWAPState | null> {
    if (this.config.useDemoData) {
      return null;
    }

    const query = `
      SELECT weighted_sum, total_seconds, twap_value, last_block_number, last_block_timestamp
      FROM twap_state
      WHERE window_type = $1
      AND is_confirmed = true
      FOR UPDATE
    `;

    try {
      const result = await this.pitchlakeClient?.query(query, [windowType]);
      if (!result || result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        weightedSum: Number(row.weighted_sum),
        totalSeconds: Number(row.total_seconds),
        twapValue: Number(row.twap_value),
        lastBlockNumber: Number(row.last_block_number),
        lastBlockTimestamp: Number(row.last_block_timestamp),
      };
    } catch (error) {
      console.error(`Error fetching TWAP state for ${windowType}:`, error);
      throw error;
    }
  }

  async saveTWAPState(windowType: TWAPWindowType, state: TWAPState): Promise<void> {
    if (this.config.useDemoData) {
      return;
    }

    const query = `
      INSERT INTO twap_state (window_type, weighted_sum, total_seconds, twap_value, last_block_number, last_block_timestamp, is_confirmed)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      ON CONFLICT (window_type, is_confirmed)
      DO UPDATE SET
        weighted_sum = EXCLUDED.weighted_sum,
        total_seconds = EXCLUDED.total_seconds,
        twap_value = EXCLUDED.twap_value,
        last_block_number = EXCLUDED.last_block_number,
        last_block_timestamp = EXCLUDED.last_block_timestamp
    `;

    try {
      await this.pitchlakeClient?.query(query, [
        windowType,
        state.weightedSum,
        state.totalSeconds,
        state.twapValue,
        state.lastBlockNumber,
        state.lastBlockTimestamp,
      ]);
    } catch (error) {
      console.error(`Error saving TWAP state for ${windowType}:`, error);
      throw error;
    }
  }

  async getFossilBlocks(startTimestamp: number, endTimestamp: number): Promise<any[]> {
    if (this.config.useDemoData) {
      return [];
    }

    const query = `
      SELECT timestamp, basefee
      FROM blockheaders
      WHERE timestamp >= $1 AND timestamp <= $2
      ORDER BY timestamp ASC
    `;

    try {
      const result = await this.fossilClient?.query(query, [startTimestamp, endTimestamp]);
      return result?.rows || [];
    } catch (error) {
      console.error('Error fetching Fossil blocks:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (this.fossilClient) {
      await this.fossilClient.end();
    }
    if (this.pitchlakeClient) {
      await this.pitchlakeClient.end();
    }
  }
} 