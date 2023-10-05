use std::cell::RefCell;

use candid::CandidType;
use ic_cdk::{api::time, query, update};

#[derive(Clone, Copy, CandidType)]
struct Statistics {
    timestamp: u64,
    dev: u64,
    prod: u64,
}

#[derive(Default)]
struct State {
    statistics: Vec<Statistics>,
}

thread_local! {
    static STATE: RefCell<State> = RefCell::default();
}

const ONE_DAY: u64 = 1_000_000_000 * 60 * 60 * 24;

#[update]
fn increment_stats(dev: u64, prod: u64) {
    STATE.with(|s| {
        let current_timestamp = time();
        let mut state = s.borrow_mut();

        if state.statistics.is_empty() {
            let stats = Statistics {
                dev,
                prod,
                timestamp: current_timestamp,
            };

            state.statistics.push(stats);
        }

        let last_idx = state.statistics.len() - 1;
        let last_entry = state.statistics.get_mut(last_idx).unwrap();

        if current_timestamp - last_entry.timestamp >= ONE_DAY {
            let stats = Statistics {
                dev,
                prod,
                timestamp: current_timestamp,
            };

            state.statistics.push(stats);
        } else {
            last_entry.dev += dev;
            last_entry.prod += prod;
        }
    });
}

#[query]
fn get_stats() -> Vec<Statistics> {
    STATE.with(|s| s.borrow().statistics.clone())
}
