use std::{borrow::Borrow, str::FromStr, time::Duration};

use candid::{CandidType, Nat, Principal};
use ic_cdk::call;
use ic_cdk_timers::set_timer;
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

pub const ERROR_INVOICE_NOT_FOUND: ErrorCode = 1;
pub const ERROR_INVALID_INVOICE_STATUS: ErrorCode = 2;
pub const ERROR_INVALID_MEMO: ErrorCode = 3;
pub const ERROR_INSUFFICIENT_FUNDS: ErrorCode = 4;
pub const ERROR_INVALID_RECEPIENT: ErrorCode = 5;
pub const ERROR_INVALID_TRANSACTION_CERT: ErrorCode = 6;

#[derive(CandidType, Deserialize, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub struct Account {
    pub principal_id: Principal,
    pub subaccount: [u8; 32],
}

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

// TODO
pub fn unwrap_cert_chain(chain: &RawPayCertificateChain) -> Option<TransferTxn> {
    Some(TransferTxn {
        from: Account {
            principal_id: Principal::anonymous(),
            subaccount: [0u8; 32],
        },
        to: Account {
            principal_id: Principal::anonymous(),
            subaccount: [0u8; 32],
        },
        qty: Nat::from(100u32),
        token_id: Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai").unwrap(),
        memo: [0u8; 32],
    })
}

pub fn unwrap_shop_cert(shop_cert: RawShopCert) -> ShopId {
    0
}

// TODO
pub fn verify_raw_cert_chain(chain: RawPayCertificateChain) -> bool {
    true
}

// TODO
pub fn parse_block() -> (TokenId, Nat) {
    (Principal::anonymous(), Nat::from(0u32))
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
