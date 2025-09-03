import { Logger } from "winston";
import { StateTransitionService } from "./stateTransitionService";

export function scheduleStateTransition(
  services: StateTransitionService[], 
  logger: Logger
): () => Promise<void> {
  return async () => {
    logger.info("Running scheduled state transition checks");
    
    const results = await Promise.allSettled(services.map(service =>
      service.checkAndTransition()
        .catch(error => {
          logger.error(`Error in state transition check for vault ${service.getVaultAddress()}:`, error);
          return Promise.reject(error);
        })
    ));

    const failures = results.filter(r => r.status === 'rejected').length;
    const successes = results.filter(r => r.status === 'fulfilled').length;
    
    logger.info(`State transition checks completed. Successes: ${successes}, Failures: ${failures}`);
  };
}

export function createStateTransitionServices(
  vaultAddresses: string[],
  logger: Logger
): StateTransitionService[] {
  return vaultAddresses.map(vaultAddress => {
    const vaultLogger = logger.child({ vault: vaultAddress.slice(0, 7) });
    return new StateTransitionService(vaultAddress, vaultLogger);
  });
} 