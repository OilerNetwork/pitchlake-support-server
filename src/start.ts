import * as dotenv from "dotenv";
import { setupLogger } from './shared/logger';
import * as cron from 'node-cron';
import { Runner } from './services/runner';
import { 
  scheduleStateTransition, 
  createStateTransitionServices 
} from './services/state-transition';
import { ConfirmedTWAPsService } from './services/confirmed-twaps';

dotenv.config();
const logger = setupLogger('Main');

class RefactoredArchitectureSupportServer {
  private confirmedTWAPsService: ConfirmedTWAPsService;

  constructor() {
    this.confirmedTWAPsService = new ConfirmedTWAPsService();
  }

  async start(): Promise<void> {
    const {
      STARKNET_RPC,
      STARKNET_PRIVATE_KEY,
      STARKNET_ACCOUNT_ADDRESS,
      VAULT_ADDRESSES,
      FOSSIL_API_KEY,
      FOSSIL_API_URL,
      CRON_SCHEDULE,
      USE_DEMO_DATA
    } = process.env;
    
    // Validate environment variables and set up services
    let stateTransitionServices: any[] = [];
    
    // Check if we're in demo mode
    if (USE_DEMO_DATA === 'true') {
      logger.info('Running in demo mode - skipping StarkNet service initialization');
    } else {
      // Check required environment variables for production mode
      if (!STARKNET_RPC || !STARKNET_PRIVATE_KEY || !STARKNET_ACCOUNT_ADDRESS || !VAULT_ADDRESSES || !FOSSIL_API_KEY || !FOSSIL_API_URL) {
        throw new Error("Missing required environment variables");
      }
      
      // Validate cron schedule
      if (!CRON_SCHEDULE || !cron.validate(CRON_SCHEDULE as string)) {
        throw new Error(`Invalid cron schedule: ${CRON_SCHEDULE}`);
      }
      
      const vaultAddresses = VAULT_ADDRESSES.split(',').map(addr => addr.trim());
      
      // Create state transition services using the new factory function
      stateTransitionServices = createStateTransitionServices(vaultAddresses, logger);
      
      // Schedule state transition cron job
      cron.schedule(CRON_SCHEDULE as string, scheduleStateTransition(stateTransitionServices, logger));
    }
    
    // Initialize confirmed TWAPs service
    try {
      await this.confirmedTWAPsService.initialize();
      logger.info('Confirmed TWAPs service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize confirmed TWAPs service:', error);
      // Don't throw here as this service is not critical for the main functionality
    }
    
    const runner = new Runner();
    try {
      logger.info('Starting Refactored Architecture Support Server...');

      // Start all services
      await Promise.all([
        // Add any additional service initializations here
      ]);

      logger.info('All services started successfully');
      
      let shouldRecalibrate = true;
      while(shouldRecalibrate) {
        shouldRecalibrate = await runner.initialize();
      }
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
      logger.info('Shutting down Refactored Architecture Support Server...');
    
      try {
        // Stop all cron jobs gracefully using built-in getTasks()
        const tasks = cron.getTasks();
        for (const [id, task] of tasks) {
          task.stop();
        }
        logger.info(`Stopped ${tasks.size} cron jobs`);
        
        // Shutdown confirmed TWAPs service
        await this.confirmedTWAPsService.shutdown();
        logger.info('Confirmed TWAPs service shutdown complete');
        
        await Promise.all([
          // Add any additional cleanup tasks here
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
const server = new RefactoredArchitectureSupportServer();
server.start().catch((error) => {
  logger.error('Fatal error starting server:', error);
  process.exit(1);
}); 