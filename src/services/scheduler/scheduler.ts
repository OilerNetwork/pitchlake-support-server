import { setupLogger } from "../../shared/logger";
import { StateTransitionService } from "../state-transition";
import { Logger } from "winston";
export const runStateTransition = (logger: Logger) => async () => {
  const { VAULT_ADDRESSES } = process.env;
  if (!VAULT_ADDRESSES) return;
  const vaultAddresses = VAULT_ADDRESSES.split(",").map((addr) => addr.trim());

  const services: StateTransitionService[] = [];
  // Create services for each vault
  logger.info("Creating services for all Vaults");
  vaultAddresses.forEach((vaultAddress) => {
    try {
      const logger = setupLogger(`Vault ${vaultAddress.slice(0, 7)}`);
      logger.info("New vault, address", { vaultAddress });
      const newService = new StateTransitionService(vaultAddress, logger);
      services.push(newService);
    } catch (error) {
      logger.info("Failed to create service for vault", { vaultAddress });
    }
  });
  if (services.length===0){
    logger.info("No vault services created, returning early")
    return
  }
  const results = await Promise.allSettled(
    services.map((service) =>
      service.checkAndTransition().catch((error) => {
        logger.error(
          `Error in state transition check for vault ${service.getVaultAddress()}:`,
          error
        );
        return Promise.reject(error);
      })
    )
  );

  const failures = results.filter((r) => r.status === "rejected").length;
  const successes = results.filter((r) => r.status === "fulfilled").length;
  logger.info(
    `State transition checks completed. Successes: ${successes}, Failures: ${failures}`
  );
};

const scheduleFossilTwapUpdate = () => {};
