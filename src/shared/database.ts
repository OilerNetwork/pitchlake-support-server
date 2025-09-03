import { Client, Pool } from 'pg';

export class DatabaseManager {
  private fossilClient?: Client;
  private pitchlakeClient?: Client;
  private fossilPool?: Pool;
  private pitchlakePool?: Pool;

  async createClients(): Promise<void> {
    // Create Fossil DB client
    this.fossilClient = new Client({
      connectionString: process.env.FOSSIL_DB_CONNECTION_STRING,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Create PitchLake DB client
    this.pitchlakeClient = new Client({
      connectionString: process.env.PITCHLAKE_DB_CONNECTION_STRING,
      ssl: {
        rejectUnauthorized: false
      }
    });

    await this.fossilClient.connect();
    await this.pitchlakeClient.connect();
  }

  async createPools(): Promise<void> {
    // Create Fossil DB pool
    this.fossilPool = new Pool({
      connectionString: process.env.FOSSIL_DB_CONNECTION_STRING,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Create PitchLake DB pool
    this.pitchlakePool = new Pool({
      connectionString: process.env.PITCHLAKE_DB_CONNECTION_STRING,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  getFossilClient(): Client {
    if (!this.fossilClient) {
      throw new Error('Fossil client not initialized');
    }
    return this.fossilClient;
  }

  getPitchlakeClient(): Client {
    if (!this.pitchlakeClient) {
      throw new Error('PitchLake client not initialized');
    }
    return this.pitchlakeClient;
  }

  getFossilPool(): Pool {
    if (!this.fossilPool) {
      throw new Error('Fossil pool not initialized');
    }
    return this.fossilPool;
  }

  getPitchlakePool(): Pool {
    if (!this.pitchlakePool) {
      throw new Error('PitchLake pool not initialized');
    }
    return this.pitchlakePool;
  }

  async cleanup(): Promise<void> {
    if (this.fossilClient) {
      await this.fossilClient.end();
    }
    if (this.pitchlakeClient) {
      await this.pitchlakeClient.end();
    }
    if (this.fossilPool) {
      await this.fossilPool.end();
    }
    if (this.pitchlakePool) {
      await this.pitchlakePool.end();
    }
  }
} 