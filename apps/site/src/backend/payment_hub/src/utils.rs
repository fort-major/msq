use std::{borrow::Borrow, str::FromStr, time::Duration};

use candid::{CandidType, Nat, Principal};
use ic_cdk::{api::call::CallResult, call};
use ic_cdk_timers::set_timer;
use icrc_ledger_types::{
    icrc::generic_value::{ICRC3Value, Value},
    icrc1::{
        account::Account,
        transfer::{BlockIndex, TransferArg, TransferError},
    },
    icrc3::blocks::{BlockWithId, GetBlocksRequest, GetBlocksResponse, GetBlocksResult},
};
use serde::Deserialize;
use tinystr::TinyStr16;

use crate::{
    exchange_rates::ExchangeRatesState,
    invoices::Refund,
    tokens::{SupportedTokensState, TokenId},
};

pub type RawShopCert = Vec<u8>;
pub type Timestamp = u64;
pub type USD = Nat;
pub type InvoiceId = [u8; 32];
pub type ShopId = u64;
pub type RawPayCertificateChain = Vec<Vec<u8>>;
pub type ErrorCode = u16;

pub const DEFAULT_TTL: u8 = 1;
pub const RECYCLING_TTL: u8 = 0;
pub const USD_DECIMALS: u8 = 8;

pub const ID_GENERATION_DOMAIN: &[u8] = b"msq-id-generation";
pub const MEMO_GENERATION_DOMAIN: &[u8] = b"msq-memo_generation";
pub const SHOP_ID_SUBACCOUNT_DOMAIN: &[u8] = b"msq-shop-id-subaccount";
pub const EXCHANGE_RATES_CANISTER_ID: &str = "u45jl-liaaa-aaaam-abppa-cai";

pub struct TransferTxn {
    pub from: Account,
    pub to: Account,
    pub qty: Nat,
    pub token_id: TokenId,
    pub memo: [u8; 32],
}

impl TransferTxn {
    pub fn get_implied_exchange_rate(
        &self,
        exchange_rates: &ExchangeRatesState,
        exchange_rate_timestamp: Timestamp,
        supported_tokens_state: &SupportedTokensState,
    ) -> USD {
        let ticker = supported_tokens_state
            .ticker_by_token_id(&self.token_id)
            .expect("Unsuported token");

        exchange_rates
            .get_exchange_rate(&exchange_rate_timestamp, &ticker)
            .clone()
    }
}

pub fn calc_shop_subaccount(shop_id: ShopId) -> [u8; 32] {
    blake3::Hasher::new()
        .update(SHOP_ID_SUBACCOUNT_DOMAIN)
        .update(&shop_id.to_le_bytes())
        .finalize()
        .into()
}

pub async fn perform_refund(refund: Refund) {
    // TODO:
}

pub fn set_immediate(func: impl FnOnce() + 'static) {
    set_timer(Duration::ZERO, func);
}

#[derive(CandidType, Deserialize)]
pub struct ExchangeRateExternal(pub (Nat, Nat), pub String, pub f64);
pub type FetchExchangeRatesResponse = Vec<ExchangeRateExternal>;

pub async fn fetch_exchange_rates() -> FetchExchangeRatesResponse {
    let response: (FetchExchangeRatesResponse,) = call(
        Principal::from_str(EXCHANGE_RATES_CANISTER_ID).unwrap(),
        "get_latest",
        (),
    )
    .await
    .expect("Exchange rate fetch failed");

    response.0
}

pub fn f64_to_usd(f: f64) -> USD {
    if f.is_nan() || f.is_infinite() || f.is_sign_negative() || f == 0f64 {
        panic!("Invalid f64 - {f}");
    }

    USD::from((f * 10f64.powi(USD_DECIMALS as i32)) as u128)
}

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Clone, Copy)]
pub struct Ticker(pub TinyStr16);

impl Borrow<str> for Ticker {
    fn borrow(&self) -> &str {
        self.0.borrow()
    }
}

impl<T> From<T> for Ticker
where
    T: AsRef<str>,
{
    fn from(value: T) -> Self {
        Self(TinyStr16::from_str(value.as_ref()).unwrap())
    }
}

impl CandidType for Ticker {
    fn _ty() -> candid::types::Type {
        String::_ty()
    }

    fn idl_serialize<S>(&self, serializer: S) -> Result<(), S::Error>
    where
        S: candid::types::Serializer,
    {
        self.0.idl_serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for Ticker {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        Ok(Ticker(
            TinyStr16::from_str(String::deserialize(deserializer)?.as_str()).unwrap(),
        ))
    }
}

#[derive(Clone, Copy)]
pub struct ICRC1CanisterClient {
    pub canister_id: Principal,
}

impl ICRC1CanisterClient {
    pub fn new(canister_id: Principal) -> Self {
        Self { canister_id }
    }

    pub async fn icrc1_transfer(
        &self,
        arg: TransferArg,
    ) -> CallResult<(Result<BlockIndex, TransferError>,)> {
        call(self.canister_id, "icrc1_transfer", (arg,)).await
    }

    pub async fn icrc3_get_blocks(&self, arg: GetBlocksRequest) -> CallResult<(GetBlocksResult,)> {
        call(self.canister_id, "icrc3_get_blocks", (arg,)).await
    }
}

pub fn icrc3_block_to_transfer_txn(
    block: &BlockWithId,
    token_id: Principal,
) -> Result<TransferTxn, String> {
    match block.block {
        ICRC3Value::Map(block_fields) => {
            let btype_is_1xfer = block_fields
                .get("btype")
                .map(|it| match it {
                    ICRC3Value::Text(v) => v == "1xfer",
                    _ => false,
                })
                .unwrap_or(false);

            let tx = block_fields
                .get("tx")
                .ok_or("No tx field found in block".to_string())?;

            match tx {
                ICRC3Value::Map(tx_fields) => {
                    let tx_op_is_xfer = tx_fields
                        .get("op")
                        .map(|it| match it {
                            ICRC3Value::Text(v) => v == "xfer",
                            _ => false,
                        })
                        .unwrap_or(false);

                    if !(tx_op_is_xfer || btype_is_1xfer) {
                        return Err("Invalid txn type".to_string());
                    }

                    let amount_val = tx_fields
                        .get("amt")
                        .ok_or("The block contains no 'amt' field".to_string())?;
                    let amount = match amount_val {
                        ICRC3Value::Nat(a) => a,
                        _ => return Err("Invalid 'amt' field".to_string()),
                    };

                    let to_val = tx_fields
                        .get("to")
                        .ok_or("The block contains no 'to' field".to_string())?;
                    let to = match to_val {
                        ICRC3Value::Array(to_arr) => {
                            let to_owner_val = to_arr
                                .get(0)
                                .ok_or("No recepient principal found in the block".to_string())?;
                            let to_subaccount_val = to_arr
                                .get(1)
                                .ok_or("No recepient subaccount found in the block".to_string())?;

                            let to_owner = match to_owner_val {
                                ICRC3Value::Blob(b) => Principal::from_slice(b.as_slice()),
                                _ => return Err("Invalid 'to_owner' field".to_string()),
                            };
                            let to_subaccount_slice = match to_subaccount_val {
                                ICRC3Value::Blob(b) => b.as_slice(),
                                _ => return Err("Invalid 'to_subaccount' field".to_string()),
                            };

                            let mut to_subaccount = [0u8; 32];
                            to_subaccount.copy_from_slice(&to_subaccount_slice);

                            Account {
                                owner: to_owner,
                                subaccount: Some(to_subaccount),
                            }
                        }
                        _ => return Err("Invalid 'to' field".to_string()),
                    };

                    let from_val = tx_fields
                        .get("from")
                        .ok_or("The block contains no 'from' field".to_string())?;
                    let from = match from_val {
                        ICRC3Value::Array(from_arr) => {
                            let from_owner_val = from_arr
                                .get(0)
                                .ok_or("No sender principal found in the block".to_string())?;
                            let from_subaccount_val = from_arr
                                .get(1)
                                .ok_or("No sender subaccount found in the block".to_string())?;

                            let from_owner = match from_owner_val {
                                ICRC3Value::Blob(b) => Principal::from_slice(b.as_slice()),
                                _ => return Err("Invalid 'from_owner' field".to_string()),
                            };
                            let from_subaccount_slice = match from_subaccount_val {
                                ICRC3Value::Blob(b) => b.as_slice(),
                                _ => return Err("Invalid 'from_subaccount' field".to_string()),
                            };

                            let mut from_subaccount = [0u8; 32];
                            from_subaccount.copy_from_slice(&from_subaccount_slice);

                            Account {
                                owner: from_owner,
                                subaccount: Some(from_subaccount),
                            }
                        }
                        _ => return Err("Invalid 'to' field".to_string()),
                    };

                    let memo_val = tx_fields
                        .get("memo")
                        .ok_or("The block contains no 'memo' field".to_string())?;
                    let memo = match memo_val {
                        ICRC3Value::Blob(b) => {
                            let mut res = [0u8; 32];
                            res.copy_from_slice(b.as_slice());

                            res
                        }
                        _ => return Err("Invalid 'memo' field".to_string()),
                    };

                    Ok(TransferTxn {
                        from,
                        to,
                        qty: amount.clone(),
                        token_id,
                        memo,
                    })
                }
                _ => Err("Invalid tx format".to_string()),
            }
        }
        _ => Err("Invalid block format".to_string()),
    }
}
