use std::time::Duration;

use candid::{Nat, Principal};
use ic_cdk_timers::set_timer;

use crate::{invoices::RawCertificateChain, tokens::TokenId};

pub fn set_immediate(func: impl FnOnce() + 'static) {
    set_timer(Duration::ZERO, func);
}

pub type ExchangeRates = u64;
pub type USD = Nat;

pub const USD_DECIMALS: u8 = 8;

pub async fn fetch_exchange_rates() -> ExchangeRates {
    return 0;
}

pub fn parse_block() -> (TokenId, Nat) {
    (Principal::anonymous(), Nat::from(0u32))
}

pub fn verify_raw_cert_chain(chain: RawCertificateChain) -> bool {
    true
}
