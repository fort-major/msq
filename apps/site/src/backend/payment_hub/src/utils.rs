use std::time::Duration;

use candid::{Nat, Principal};
use ic_cdk_timers::set_timer;

use crate::{
    exchange_rates::{self, ExchangeRatesState},
    invoices::{Invoice, PayResult, RawCertificateChain},
    tokens::TokenId,
};

pub fn set_immediate(func: impl FnOnce() + 'static) {
    set_timer(Duration::ZERO, func);
}

pub type ExchangeRates = u64;
pub type USD = Nat;

pub const USD_DECIMALS: u8 = 8;

// TODO
pub fn parse_block() -> (TokenId, Nat) {
    (Principal::anonymous(), Nat::from(0u32))
}

pub struct Account {
    principal_id: Principal,
    subaccount: [u8; 32],
}

pub struct TransferTxn {
    pub from: Account,
    pub to: Account,
    pub qty: Nat,
    pub token_id: TokenId,
    pub memo: [u8; 32],
}

impl TransferTxn {
    // TODO: check if "to" is the valid account, check if the qty is equal (not less, not greater), check memo is invoice id
    pub fn complies_with_invoice(
        &self,
        invoice: &Invoice,
        exchange_rates: &ExchangeRatesState,
    ) -> PayResult {
        PayResult::Ok
    }
}

// TODO
pub fn unwrap_cert_chain(chain: &RawCertificateChain) -> Option<TransferTxn> {
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

// TODO
pub fn verify_raw_cert_chain(chain: RawCertificateChain) -> bool {
    true
}
