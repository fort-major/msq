use std::{cell::RefCell, collections::BTreeMap, str::FromStr};

use candid::{CandidType, Nat, Principal};
use ic_cdk::{call, query};
use serde::Deserialize;
use tinystr::TinyStrAuto;

use crate::{
    tokens::{SupportedTokensState, Ticker, SUPPORTED_TOKENS},
    utils::{USD, USD_DECIMALS},
};

#[derive(CandidType, Deserialize)]
pub struct ExchangeRateExternal((Nat, Nat), String, f64);
type FetchExchangeRatesResponse = Vec<ExchangeRateExternal>;

const EXCHANGE_RATES_CANISTER_ID: &str = "u45jl-liaaa-aaaam-abppa-cai";

#[derive(CandidType, Deserialize, Default, Clone)]
pub struct ExchangeRatesState {
    rates: BTreeMap<Ticker, USD>,
}

impl ExchangeRatesState {
    #[inline]
    pub fn get_rates(&self) -> &BTreeMap<Ticker, USD> {
        &self.rates
    }

    pub fn update_exchange_rates(
        &mut self,
        exchange_rates_external: Vec<ExchangeRateExternal>,
        supported_tokens: &SupportedTokensState,
    ) {
        for rate in exchange_rates_external {
            let tickers = rate.1.split("/").collect::<Vec<_>>();
            let ticker_to = tickers.get(1).unwrap();

            if ticker_to.to_uppercase() != "USD" {
                continue;
            }

            let ticker_from = tickers.get(0).unwrap();

            if supported_tokens.contains_ticker(ticker_from) {
                let usd_rate = f64_to_usd(rate.2);

                self.rates.insert(Ticker::from(ticker_from), usd_rate);
            }
        }
    }
}

async fn fetch_exchange_rates() -> FetchExchangeRatesResponse {
    let response: (FetchExchangeRatesResponse,) = call(
        Principal::from_str(EXCHANGE_RATES_CANISTER_ID).unwrap(),
        "get_latest",
        (),
    )
    .await
    .expect("Exchange rate fetch failed");

    response.0
}

fn f64_to_usd(f: f64) -> USD {
    if f.is_nan() || f.is_infinite() || f.is_sign_negative() || f == 0f64 {
        panic!("Invalid f64 - {f}");
    }

    USD::from((f * 10f64.powi(USD_DECIMALS as i32)) as u128)
}

thread_local! {
    pub static EXCHANGE_RATES: RefCell<ExchangeRatesState> = RefCell::default();
}

pub async fn refresh_exchange_rates() {
    let external_rates = fetch_exchange_rates().await;

    EXCHANGE_RATES.with(|rates| {
        SUPPORTED_TOKENS.with(|tokens| {
            rates
                .borrow_mut()
                .update_exchange_rates(external_rates, &tokens.borrow())
        })
    });
}

#[query]
fn get_exchange_rates() -> Vec<(Ticker, USD)> {
    EXCHANGE_RATES.with(|it| {
        it.borrow()
            .get_rates()
            .iter()
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect::<Vec<_>>()
    })
}
