import * as dotenv from "dotenv";
import { setupLogger } from './shared/logger';
import * as cron from 'node-cron';
import { UnconfirmedTWAPsRunner } from "./services/unconfirmed-twaps";
import { scheduleStateTransition, StateTransitionService } from './services/transition';

dotenv.config()
const logger = setupLogger('Main');


class ArchitectureSupportServer {

  

  constructor() {
    // Example of how to schedule a cron job:
    // cron.schedule('0 */6 * * *', () => {
    //   // Your job logic here - runs every 6 hours
    //   logger.info('Example cron job running...');
    // });
    
    // cron.schedule('0 2 * * *', () => {
    //   // Your job logic here - runs daily at 2 AM
    //   logger.info('Daily job running...');
    // });
  }

  async start(): Promise<void> {
    const {
      USE_DEMO_DATA
  } = process.env;
  
  // Validate environment variables and set up services
  
  // Check if we're in demo mode
  if (USE_DEMO_DATA === 'true') {
    logger.info('Running in demo mode - skipping StarkNet service initialization');
  } else {
    
    const vaultAddresses = VAULT_ADDRESSES.split(',').map(addr => addr.trim());
    
    // Create services for each vault
    services = vaultAddresses.map(vaultAddress => {
        const logger = setupLogger(`Vault ${vaultAddress.slice(0, 7)}`);
        return new StateTransitionService(
            STARKNET_RPC,
            STARKNET_PRIVATE_KEY,
            STARKNET_ACCOUNT_ADDRESS,
            vaultAddress,
            FOSSIL_API_KEY,
            FOSSIL_API_URL,
            logger
        )
    });
    cron.schedule(CRON_SCHEDULE as string, scheduleStateTransition(services, logger) );
  }
  
    const runner = new UnconfirmedTWAPsRunner();
    try {
      logger.info('Starting Architecture Support Server...');

      // Start all services
      await Promise.all([
        runner.initialize()
      ]);

      logger.info('All services started successfully');
      runner.startListening();

      // Handle graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start server:', error);
      throw error;
    }
  }

  private setupGracefulShutdown(): void {
    const cleanup = async () => {
      logger.info('Shutting down Architecture Support Server...');
    
      try {
        // Stop all cron jobs gracefully using built-in getTasks()
        const tasks = cron.getTasks();
        for (const [id, task] of tasks) {
          task.stop();
        }
        logger.info(`Stopped ${tasks.size} cron jobs`);
        
        await Promise.all([
        ]);
        
        logger.info('Cleanup complete, exiting');
        process.exit(0);
      } catch (error) {
        logger.error('Error during cleanup:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
  }
}




// Start the server
const server = new ArchitectureSupportServer();
server.start().catch((error) => {
  logger.error('Fatal error starting server:', error);
  process.exit(1);
}); 