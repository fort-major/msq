use std::{
    cell::RefCell,
    collections::{hash_map::Entry, BTreeMap, HashMap},
};

use candid::CandidType;
use ic_cdk::{api::time, query};
use serde::Deserialize;

use crate::{
    invoices::{InvoicesState, INVOICES_STATE},
    tokens::{SupportedTokensState, SUPPORTED_TOKENS},
    utils::{f64_to_usd, fetch_exchange_rates, ExchangeRateExternal, Ticker, Timestamp, USD},
};

#[derive(CandidType, Deserialize, Default, Clone)]
pub struct ExchangeRatesState {
    last_updated_at: Timestamp,
    rates: HashMap<Timestamp, BTreeMap<Ticker, USD>>,
}

impl ExchangeRatesState {
    #[inline]
    pub fn get_exchange_rate(&self, updated_at: &Timestamp, ticker: &Ticker) -> &USD {
        self.rates.get(updated_at).unwrap().get(ticker).unwrap()
    }

    #[inline]
    pub fn get_current_rates(&self) -> &BTreeMap<Ticker, USD> {
        self.rates
            .get(&self.last_updated_at)
            .expect("Current rates are not ready yet, try again later...")
    }

    #[inline]
    pub fn get_rates(&self, timestamp: Timestamp) -> Option<&BTreeMap<Ticker, USD>> {
        let mut keys = Vec::new();

        for key in self.rates.keys() {
            match keys.binary_search(key) {
                Err(idx) => keys.insert(idx, *key),
                _ => {}
            }
        }

        match keys.binary_search(&timestamp) {
            Ok(idx) => self.rates.get(&keys[idx]),
            Err(idx) => {
                if idx == 0 {
                    None
                } else {
                    self.rates.get(&keys[idx - 1])
                }
            }
        }
    }

    #[inline]
    pub fn delete_outdated(&mut self, timestamp: &Timestamp) {
        if *timestamp == self.last_updated_at {
            return;
        }

        self.rates.remove(&timestamp);
    }

    pub fn update_exchange_rates(
        &mut self,
        exchange_rates_external: Vec<ExchangeRateExternal>,
        supported_tokens: &SupportedTokensState,
        timestamp: Timestamp,
        invoices_state: &InvoicesState,
    ) {
        // if there are no invoices which refer to the previosly actual exchange rates - remove those rates from memory
        let previous_timestamp_referenced_by_active_invoices = invoices_state
            .active_invoices
            .get(&self.last_updated_at)
            .map(|it| it.is_empty())
            .unwrap_or_default();

        if !previous_timestamp_referenced_by_active_invoices {
            self.rates.remove(&self.last_updated_at);
        }

        // store new exchange rates as actual
        self.last_updated_at = timestamp;

        for rate in exchange_rates_external {
            let tickers = rate.1.split("/").collect::<Vec<_>>();
            let ticker_to = tickers.get(1).unwrap();

            if ticker_to.to_uppercase() != "USD" {
                continue;
            }

            let ticker_from = tickers.get(0).unwrap();

            if supported_tokens.contains_ticker(ticker_from) {
                let usd_rate = f64_to_usd(rate.2);

                match self.rates.entry(self.last_updated_at) {
                    Entry::Occupied(mut e) => {
                        e.get_mut().insert(Ticker::from(ticker_from), usd_rate);
                    }
                    Entry::Vacant(e) => {
                        let mut m = BTreeMap::new();
                        m.insert(Ticker::from(ticker_from), usd_rate);

                        e.insert(m);
                    }
                }
            }
        }
    }
}

// ------------------------ STATE ------------------------

thread_local! {
    pub static EXCHANGE_RATES: RefCell<ExchangeRatesState> = RefCell::default();
}

/**
 * It should be safe to invoke this function up to once every minute - the rest of the system is ready for multiple concurrent
 * exchange rates being present in it. In this scenario, each created invoice will use the most actual exchange rate available,
 * locking on it until it is either paid or garbage collected.
 */
pub async fn refresh_exchange_rates() {
    let external_rates = fetch_exchange_rates().await;

    EXCHANGE_RATES.with(|rates| {
        SUPPORTED_TOKENS.with(|tokens| {
            INVOICES_STATE.with(|invoices_state| {
                rates.borrow_mut().update_exchange_rates(
                    external_rates,
                    &tokens.borrow(),
                    time(),
                    &invoices_state.borrow(),
                )
            })
        })
    });
}

pub fn get_current_exchange_rate_timestamp() -> Timestamp {
    EXCHANGE_RATES.with(|it| it.borrow().last_updated_at)
}

// ------------------------- API -----------------------------

#[derive(CandidType, Deserialize)]
pub struct GetExchangeRatesRequest {
    pub timestamp: Timestamp,
}

#[derive(CandidType, Deserialize)]
pub struct GetExchangeRatesResponse {
    pub rates: Option<Vec<(Ticker, USD)>>,
}

#[query]
fn get_exchange_rates(req: GetExchangeRatesRequest) -> GetExchangeRatesResponse {
    let rates = EXCHANGE_RATES.with(|it| {
        Some(
            it.borrow()
                .get_rates(req.timestamp)?
                .iter()
                .map(|(k, v)| (k.clone(), v.clone()))
                .collect::<Vec<_>>(),
        )
    });

    GetExchangeRatesResponse { rates }
}
