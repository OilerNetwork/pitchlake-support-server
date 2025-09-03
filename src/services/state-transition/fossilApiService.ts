import axios from "axios";
import { FossilRequest } from "../../shared/types";
import { StateTransitionConfig } from "./config";

export interface FossilApiRequest {
  identifiers: string[];
  params: {
    twap: [number, number];
    volatility: [number, number];
    reserve_price: [number, number];
  };
  client_info: {
    client_address: string;
    vault_address: string;
    timestamp: number;
  };
}

export class FossilApiService {
  private config: StateTransitionConfig;

  constructor(config: StateTransitionConfig) {
    this.config = config;
  }

  async checkFossilBlocks(requestTimestamp: number): Promise<boolean> {
    try {
      const latestFossilBlockResponse = await axios.get(
        `${this.config.fossilApiUrl}/latest_block`
      );
      
      const latestFossilBlockTimestamp = latestFossilBlockResponse.data.block_timestamp;

      return latestFossilBlockTimestamp >= requestTimestamp;
    } catch (error) {
      console.error('Error checking Fossil blocks:', error);
      throw error;
    }
  }

  async sendPricingDataRequest(
    vaultContract: any,
    requestData: FossilRequest
  ): Promise<void> {
    try {
      const clientAddressRaw = await vaultContract.get_fossil_client_address();
      const clientAddress = "0x" + clientAddressRaw.toString(16);

      // Get round duration from vault contract
      const roundDuration = Number(await vaultContract.get_round_duration());

      // Calculate windows for each metric
      const twapWindow = roundDuration;
      const volatilityWindow = roundDuration * 3;
      const reservePriceWindow = roundDuration * 3;

      const fossilRequest: FossilApiRequest = {
        identifiers: [requestData.identifier],
        params: {
          twap: [requestData.timestamp - twapWindow, requestData.timestamp],
          volatility: [requestData.timestamp - volatilityWindow, requestData.timestamp],
          reserve_price: [requestData.timestamp - reservePriceWindow, requestData.timestamp]
        },
        client_info: {
          client_address: clientAddress,
          vault_address: requestData.vaultAddress,
          timestamp: requestData.timestamp
        }
      };

      const response = await axios.post(
        `${this.config.fossilApiUrl}/pricing_data`,
        fossilRequest,
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.config.fossilApiKey
          }
        }
      );

      console.log("Fossil request sent. Response: " + JSON.stringify(response.data));
    } catch (error) {
      console.error('Error sending Fossil request:', error);
      throw error;
    }
  }

  formatRawToFossilRequest(rawData: any): FossilRequest {
    return {
      vaultAddress: "0x" + rawData[0].toString(16),
      timestamp: Number(rawData[1]),
      identifier: "0x" + rawData[2].toString(16)
    };
  }
} 