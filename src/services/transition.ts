import { 
    Contract, 
    RpcProvider, 
    Account,
    CairoCustomEnum,
} from "starknet";
import { Logger } from "winston";
import { ABI as VaultAbi } from "../abi/vault";
import { ABI as OptionRoundAbi } from "../abi/optionRound";
import axios from "axios";
import { FossilRequest, OptionRoundState } from "../shared/types";


export class StateTransitionService {
    private logger: Logger;
    private provider: RpcProvider;
    private account: Account;
    private vaultContract: Contract;
    private fossilApiKey: string;
    private fossilApiUrl: string;
    private vaultAddress: string;

    constructor(
        rpcUrl: string,
        privateKey: string,
        accountAddress: string,
        vaultAddress: string,
        fossilApiKey: string,
        fossilApiUrl: string,
        logger: Logger
    ) {
        this.logger = logger;
        this.provider = new RpcProvider({ nodeUrl: rpcUrl });
        this.account = new Account(
            this.provider,
            accountAddress,
            privateKey
        );
        this.vaultContract = new Contract(
            VaultAbi,
            vaultAddress,
            this.account
        );
        this.fossilApiKey = fossilApiKey;
        this.fossilApiUrl = fossilApiUrl;
        this.vaultAddress = vaultAddress;
    }

    getVaultAddress(): string {
        return this.vaultAddress;
    }

    async checkAndTransition(): Promise<void> {
        const roundId = await this.vaultContract.get_current_round_id();
        const roundAddress = await this.vaultContract.get_round_address(roundId);

        // Convert decimal address to hex
        const roundAddressHex = "0x" + BigInt(roundAddress).toString(16);
        this.logger.info(`Checking round ${roundId} at ${roundAddressHex}`);

        const roundContract = new Contract(
            OptionRoundAbi,
            roundAddressHex,
            this.account
        );
        
        const stateRaw = await roundContract.get_state();
        const state = (stateRaw as CairoCustomEnum).activeVariant();

        const stateEnum = OptionRoundState[state as keyof typeof OptionRoundState];
        this.logger.info(`Current state: ${state}`);

        // Get latest block and its timestamp
        const latestBlockblock = await this.provider.getBlock('latest');
        const latestBlockTimestamp = Number(latestBlockblock.timestamp);
        this.logger.debug(`Using block timestamp: ${latestBlockTimestamp}`);

        switch (stateEnum) {
            case OptionRoundState.Open:
                await this.handleOpenState(roundContract, latestBlockTimestamp);
                break;
                
            case OptionRoundState.Auctioning:
                await this.handleAuctioningState(roundContract, latestBlockTimestamp);
                break;
                
            case OptionRoundState.Running:
                await this.handleRunningState(roundContract, latestBlockTimestamp);
                break;
                
            case OptionRoundState.Settled:
                this.logger.info("Round is settled - no actions possible");
                break;
        }
    }

    private formatTimeLeft(current: number, target: number): string {
        const secondsLeft = Number(target) - Number(current);
        const hoursLeft = secondsLeft / 3600;
        return `${secondsLeft} seconds (${hoursLeft.toFixed(2)} hrs)`;
    }

    private async handleOpenState(roundContract: Contract, latestBlockTimestamp: number): Promise<void> {
        try {
            // Check if this is the first round that needs initialization
            const reservePrice = await roundContract.get_reserve_price();
            
            if (reservePrice === 0n) {
                this.logger.info("First round detected - needs initialization");
                const requestData = await this.vaultContract.get_request_to_start_first_round();
                
                // Format request data for timestamp check
                const requestTimestamp = Number(requestData[1]);
                
                // Check if Fossil has required blocks before proceeding
                if (!await this.fossilHasAllBlocks(requestTimestamp)) {
                    this.logger.info(`Fossil blocks haven't reached the request timestamp yet`);
                    return;
                }
                
                // Initialize first round
                await this.sendFossilRequest(this.formatRawToFossilRequest(requestData));

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
            
            const { suggestedMaxFee: estimatedMaxFee } = await this.account.estimateInvokeFee({
                contractAddress: this.vaultContract.address,
                entrypoint: 'start_auction',
                calldata: [],
            });

            const { transaction_hash } = await this.vaultContract.start_auction({ maxFee: estimatedMaxFee * 2n });
            await this.provider.waitForTransaction(transaction_hash);
            
            this.logger.info("Auction started successfully", {
                transactionHash: transaction_hash
            });
        } catch (error) {
            this.logger.error("Error handling Open state:", error);
            throw error;
        }
    }

    private async handleAuctioningState(roundContract: Contract, latestBlockTimestamp: number): Promise<void> {
        try {
            const auctionEndTime = Number(await roundContract.get_auction_end_date());
            
            if (latestBlockTimestamp < auctionEndTime) {
                this.logger.info(`Waiting for auction end time. Time left: ${this.formatTimeLeft(latestBlockTimestamp, auctionEndTime)}`);
                return;
            }

            this.logger.info("Ending auction...");
        
            const { suggestedMaxFee: estimatedMaxFee } = await this.account.estimateInvokeFee({
                contractAddress: this.vaultContract.address,
                entrypoint: 'end_auction',
                calldata: [],
            });

            const { transaction_hash } = await this.vaultContract.end_auction({ maxFee: estimatedMaxFee * 2n});
            await this.provider.waitForTransaction(transaction_hash);
            
            this.logger.info("Auction ended successfully", {
                transactionHash: transaction_hash
            });
        } catch (error) {
            this.logger.error("Error handling Auctioning state:", error);
            throw error;
        }
    }

    private async fossilHasAllBlocks(requestTimestamp: number): Promise<boolean> {
        const latestFossilBlockResponse = await axios.get(
            `${this.fossilApiUrl}/latest_block`
        );
        
        const latestFossilBlockTimestamp = latestFossilBlockResponse.data.block_timestamp;

        this.logger.debug("Latest Fossil block info:", {
            blockNumber: latestFossilBlockResponse.data.latest_block_number,
            blockTimestamp: latestFossilBlockTimestamp,
            requestTimestamp
        });

        if (latestFossilBlockTimestamp < requestTimestamp) {
            return false;
        }

        return true;
    }

    private formatRawToFossilRequest(rawData: any): FossilRequest {
        return {
            vaultAddress: "0x" + rawData[0].toString(16),
            timestamp: Number(rawData[1]),
            identifier: "0x" + rawData[2].toString(16)
        };
    }

    private async sendFossilRequest(requestData: FossilRequest): Promise<void> {
        // Format request data
        const vaultAddress = requestData.vaultAddress;
        const requestTimestamp = Number(requestData.timestamp);
        const identifier = requestData.identifier;

        const clientAddressRaw = await this.vaultContract.get_fossil_client_address();
        const clientAddress = "0x" + clientAddressRaw.toString(16);

        // Get round duration from vault contract
        const roundDuration = Number(await this.vaultContract.get_round_duration());

        // Calculate windows for each metric
        const twapWindow = roundDuration;
        const volatilityWindow = roundDuration * 3;
        const reservePriceWindow = roundDuration * 3;

        this.logger.debug("Calculation windows:", {
            roundDuration,
            twapWindow,
            volatilityWindow,
            reservePriceWindow
        });

        const fossilRequest = {
            identifiers: [identifier],
            params: {
                twap: [requestTimestamp - twapWindow, requestTimestamp],
                volatility: [requestTimestamp - volatilityWindow, requestTimestamp],
                reserve_price: [requestTimestamp - reservePriceWindow, requestTimestamp]
            },
            client_info: {
                client_address: clientAddress,
                vault_address: vaultAddress,
                timestamp: requestTimestamp
            }
        };

        this.logger.info("Sending request to Fossil API");
        this.logger.debug({ request: fossilRequest });

        const response = await axios.post(
            `${this.fossilApiUrl}/pricing_data`,
            fossilRequest,
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": this.fossilApiKey
                }
            }
        );

        this.logger.info("Fossil request sent. Response: " + JSON.stringify(response.data));
    }

    private async handleRunningState(roundContract: Contract, latestBlockTimestamp: number): Promise<void> {
        try {
            const settlementTime = Number(await roundContract.get_option_settlement_date());
            
            if (latestBlockTimestamp < settlementTime) {
                this.logger.info(`Waiting for settlement time. Time left: ${this.formatTimeLeft(latestBlockTimestamp, settlementTime)}`);
                return;
            }

            this.logger.info("Settlement time reached");
            
            const rawRequestData = await this.vaultContract.get_request_to_settle_round();
            const requestData = this.formatRawToFossilRequest(rawRequestData);
            
            // Check if Fossil has required blocks before proceeding
            if (!await this.fossilHasAllBlocks(Number(requestData.timestamp))) {
                this.logger.info(`Fossil blocks haven't reached the request timestamp yet`);
                return;
            }

            await this.sendFossilRequest(requestData);
        } catch (error) {
            this.logger.error("Error handling Running state:", error);
            throw error;
        }
    }
} 
export const scheduleStateTransition = (services: StateTransitionService[], logger:Logger)=>async() => {
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
}