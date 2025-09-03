// TWAP Types
export type TWAPWindowType = "twelve_min" | "three_hour" | "thirty_day";

export interface TWAPState {
  weightedSum: number;
  totalSeconds: number;
  twapValue: number;
  lastBlockNumber: number;
  lastBlockTimestamp: number;
}

export interface BlockWithNextTimestamp {
  number: number;
  timestamp: number;
  nextTimestamp?: number;
  
}


export interface BlockWithNextTimestampFossil {
  timestamp: number;
  next_timestamp: number | null;
  basefee: number;
}
export interface FormattedBlockData {
  blockNumber: number;
  timestamp: number;
  gasPrice: number;
  gasUsed: number;
  baseFeePerGas?: number;
  priorityFeePerGas?: number;
}

export interface TWAPStateContainer {
  [key: string]: TWAPState;
}
export interface FormattedBlockDataFossil {
  blockNumber: number;
  timestamp: number;
  basefee: number | undefined;

}

// Block Watcher Types
export interface BlockData {
  number: number;
  timestamp: number;
  gasPrice: number;
  gasUsed: number;
  baseFeePerGas?: number;
  priorityFeePerGas?: number;
}

// State Transition Types
export interface FossilRequest {
  vaultAddress: string;
  timestamp: number;
  identifier: string;
}

export enum OptionRoundState {
  Open = 0,
  Auctioning = 1,
  Running = 2,
  Settled = 3
} 
