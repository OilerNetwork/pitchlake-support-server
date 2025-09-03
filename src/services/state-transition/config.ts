export interface StateTransitionConfig {
  starknetRpcUrl: string;
  starknetPrivateKey: string;
  starknetAccountAddress: string;
  fossilApiKey: string;
  fossilApiUrl: string;
  vaultAddresses: string[];
}

export function loadStateTransitionConfig(): StateTransitionConfig {
  const {
    STARKNET_RPC,
    STARKNET_PRIVATE_KEY,
    STARKNET_ACCOUNT_ADDRESS,
    VAULT_ADDRESSES,
    FOSSIL_API_KEY,
    FOSSIL_API_URL
  } = process.env;

  if (!STARKNET_RPC || !STARKNET_PRIVATE_KEY || !STARKNET_ACCOUNT_ADDRESS || !VAULT_ADDRESSES || !FOSSIL_API_KEY || !FOSSIL_API_URL) {
    throw new Error("Missing required environment variables for state transition service");
  }

  const vaultAddresses = VAULT_ADDRESSES.split(',').map(addr => addr.trim());

  return {
    starknetRpcUrl: STARKNET_RPC,
    starknetPrivateKey: STARKNET_PRIVATE_KEY,
    starknetAccountAddress: STARKNET_ACCOUNT_ADDRESS,
    fossilApiKey: FOSSIL_API_KEY,
    fossilApiUrl: FOSSIL_API_URL,
    vaultAddresses
  };
} 