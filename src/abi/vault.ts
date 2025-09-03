export const ABI = [
  {
    "type": "impl",
    "name": "VaultImpl",
    "interface_name": "pitch_lake::vault::interface::IVault"
  },
  {
    "type": "enum",
    "name": "pitch_lake::vault::interface::VaultType",
    "variants": [
      {
        "name": "InTheMoney",
        "type": "()"
      },
      {
        "name": "AtTheMoney",
        "type": "()"
      },
      {
        "name": "OutOfMoney",
        "type": "()"
      }
    ]
  },
  {
    "type": "struct",
    "name": "core::integer::u256",
    "members": [
      {
        "name": "low",
        "type": "core::integer::u128"
      },
      {
        "name": "high",
        "type": "core::integer::u128"
      }
    ]
  },
  {
    "type": "struct",
    "name": "core::array::Span::<core::felt252>",
    "members": [
      {
        "name": "snapshot",
        "type": "@core::array::Array::<core::felt252>"
      }
    ]
  },
  {
    "type": "struct",
    "name": "pitch_lake::fossil_client::interface::L1Data",
    "members": [
      {
        "name": "twap",
        "type": "core::integer::u256"
      },
      {
        "name": "volatility",
        "type": "core::integer::u128"
      },
      {
        "name": "reserve_price",
        "type": "core::integer::u256"
      }
    ]
  },
  {
    "type": "struct",
    "name": "pitch_lake::fossil_client::interface::RoundSettledReturn",
    "members": [
      {
        "name": "total_payout",
        "type": "core::integer::u256"
      }
    ]
  },
  {
    "type": "enum",
    "name": "pitch_lake::fossil_client::interface::FossilCallbackReturn",
    "variants": [
      {
        "name": "RoundSettled",
        "type": "pitch_lake::fossil_client::interface::RoundSettledReturn"
      },
      {
        "name": "FirstRoundInitialized",
        "type": "()"
      }
    ]
  },
  {
    "type": "struct",
    "name": "pitch_lake::types::Bid",
    "members": [
      {
        "name": "bid_id",
        "type": "core::felt252"
      },
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "amount",
        "type": "core::integer::u256"
      },
      {
        "name": "price",
        "type": "core::integer::u256"
      },
      {
        "name": "tree_nonce",
        "type": "core::integer::u64"
      }
    ]
  },
  {
    "type": "interface",
    "name": "pitch_lake::vault::interface::IVault",
    "items": [
      {
        "type": "function",
        "name": "get_vault_type",
        "inputs": [],
        "outputs": [
          {
            "type": "pitch_lake::vault::interface::VaultType"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_alpha",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u128"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_strike_level",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::i128"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_eth_address",
        "inputs": [],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_fossil_client_address",
        "inputs": [],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_round_transition_duration",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u64"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_auction_duration",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u64"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_round_duration",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u64"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_current_round_id",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u64"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_round_address",
        "inputs": [
          {
            "name": "option_round_id",
            "type": "core::integer::u64"
          }
        ],
        "outputs": [
          {
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_vault_total_balance",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_vault_locked_balance",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_vault_unlocked_balance",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_vault_stashed_balance",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_vault_queued_bps",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u128"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_account_total_balance",
        "inputs": [
          {
            "name": "account",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_account_locked_balance",
        "inputs": [
          {
            "name": "account",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_account_unlocked_balance",
        "inputs": [
          {
            "name": "account",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_account_stashed_balance",
        "inputs": [
          {
            "name": "account",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_account_queued_bps",
        "inputs": [
          {
            "name": "account",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u128"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_request_to_settle_round",
        "inputs": [],
        "outputs": [
          {
            "type": "core::array::Span::<core::felt252>"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_request_to_start_first_round",
        "inputs": [],
        "outputs": [
          {
            "type": "core::array::Span::<core::felt252>"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "deposit",
        "inputs": [
          {
            "name": "amount",
            "type": "core::integer::u256"
          },
          {
            "name": "account",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "withdraw",
        "inputs": [
          {
            "name": "amount",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "queue_withdrawal",
        "inputs": [
          {
            "name": "bps",
            "type": "core::integer::u128"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "withdraw_stash",
        "inputs": [
          {
            "name": "account",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "fossil_client_callback",
        "inputs": [
          {
            "name": "l1_data",
            "type": "pitch_lake::fossil_client::interface::L1Data"
          },
          {
            "name": "timestamp",
            "type": "core::integer::u64"
          }
        ],
        "outputs": [
          {
            "type": "pitch_lake::fossil_client::interface::FossilCallbackReturn"
          }
        ],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "start_auction",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "end_auction",
        "inputs": [],
        "outputs": [
          {
            "type": "(core::integer::u256, core::integer::u256)"
          }
        ],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "place_bid",
        "inputs": [
          {
            "name": "amount",
            "type": "core::integer::u256"
          },
          {
            "name": "price",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "pitch_lake::types::Bid"
          }
        ],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "update_bid",
        "inputs": [
          {
            "name": "bid_id",
            "type": "core::felt252"
          },
          {
            "name": "price_increase",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "pitch_lake::types::Bid"
          }
        ],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "refund_unused_bids",
        "inputs": [
          {
            "name": "round_address",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "account",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "mint_options",
        "inputs": [
          {
            "name": "round_address",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "exercise_options",
        "inputs": [
          {
            "name": "round_address",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "external"
      }
    ]
  }
] as const; 