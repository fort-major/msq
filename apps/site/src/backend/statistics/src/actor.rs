use std::cell::RefCell;

use candid::{CandidType, Deserialize};
use ic_cdk::{
    api::time,
    init, post_upgrade, pre_upgrade, query,
    storage::{stable_restore, stable_save},
    update,
};

#[derive(Clone, CandidType, Deserialize)]
struct Data {
    pub login: u32,
    pub transfer: u32,
    pub origin_link: u32,
    pub origin_unlink: u32,
}

impl Data {
    fn merge(&mut self, other: Data) {
        self.login += other.login;
        self.transfer += other.transfer;
        self.origin_link += other.origin_link;
        self.origin_unlink += other.origin_unlink;
    }
}

#[derive(Clone, CandidType, Deserialize)]
struct Statistics {
    pub timestamp: u64,
    pub data: Data,
}

#[derive(Default, CandidType, Deserialize)]
struct State {
    statistics: Vec<Statistics>,
}

thread_local! {
    static STATE: RefCell<State> = RefCell::default();
}

const ONE_DAY: u64 = 1_000_000_000 * 60 * 60 * 24;

#[update]
fn increment_stats(data: Data) {
    STATE.with(|s| {
        let current_timestamp = time();
        let mut state = s.borrow_mut();

        if state.statistics.is_empty() {
            let stats = Statistics {
                data,
                timestamp: current_timestamp,
            };

            state.statistics.push(stats);
            return;
        }

        let last_idx = state.statistics.len() - 1;
        let last_entry = state.statistics.get_mut(last_idx).unwrap();

        if current_timestamp - last_entry.timestamp >= ONE_DAY {
            let stats = Statistics {
                data,
                timestamp: current_timestamp,
            };

            state.statistics.push(stats);
        } else {
            last_entry.data.merge(data);
        }
    });
}

#[query]
fn get_stats() -> Vec<Statistics> {
    STATE.with(|s| s.borrow().statistics.clone())
}

#[init]
fn init_hook() {
    STATE.with(|s| s.replace(State::default()));
}

#[pre_upgrade]
fn pre_upgrade_hook() {
    STATE.with(|s| {
        let state = s.replace(State::default());

        stable_save((state,)).expect("Unable to save data in stable memory");
    });
}

#[post_upgrade]
fn post_upgrade_hook() {
    STATE.with(|s| {
        let (state,): (State,) =
            stable_restore().expect("Unable to restore data from stable memory");

        s.replace(state);
    });
}
