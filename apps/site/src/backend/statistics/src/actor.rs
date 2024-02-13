use std::cell::RefCell;

use candid::{CandidType, Deserialize, Nat};
use ic_cdk::{
    api::time,
    init, post_upgrade, pre_upgrade, query,
    storage::{stable_restore, stable_save},
    update,
};

#[derive(Clone, CandidType, Deserialize)]
struct ICRC1Statistics {
    pub ICP: Nat,
    pub ckBTC: Nat,
    pub ckETH: Nat,
    pub CHAT: Nat,
    pub SONIC: Nat,
    pub SNS1: Nat,
    pub OGY: Nat,
    pub MOD: Nat,
    pub GHOST: Nat,
    pub KINIC: Nat,
    pub HOT: Nat,
    pub CAT: Nat,
}

impl ICRC1Statistics {
    fn merge(&mut self, other: ICRC1Statistics) {
        self.ICP += other.ICP;
        self.ckBTC += other.ckBTC;
        self.ckETH += other.ckETH;
        self.CHAT += other.CHAT;
        self.SONIC += other.SONIC;
        self.SNS1 += other.SNS1;
        self.OGY += other.OGY;
        self.MOD += other.MOD;
        self.GHOST += other.GHOST;
        self.KINIC += other.KINIC;
        self.HOT += other.HOT;
        self.CAT += other.CAT;
    }
}

#[derive(Clone, CandidType, Deserialize)]
struct ProdStatistics {
    pub masks_created: u32,
    pub signatures_produced: u32,
    pub icrc1_accounts_created: u32,
    pub icrc1_sent: ICRC1Statistics,
    pub origins_linked: u32,
    pub origins_unlinked: u32,
}

impl ProdStatistics {
    fn merge(&mut self, other: ProdStatistics) {
        self.masks_created += other.masks_created;
        self.signatures_produced += other.signatures_produced;
        self.origins_linked += other.origins_linked;
        self.origins_unlinked += other.origins_unlinked;
        self.icrc1_accounts_created += other.icrc1_accounts_created;
        self.icrc1_sent.merge(other.icrc1_sent);
    }
}

#[derive(Clone, CandidType, Deserialize)]
struct Statistics {
    pub timestamp: u64,
    pub prod: ProdStatistics,
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
fn increment_stats(prod: ProdStatistics) {
    STATE.with(|s| {
        let current_timestamp = time();
        let mut state = s.borrow_mut();

        if state.statistics.is_empty() {
            let stats = Statistics {
                prod,
                timestamp: current_timestamp,
            };

            state.statistics.push(stats);
            return;
        }

        let last_idx = state.statistics.len() - 1;
        let last_entry = state.statistics.get_mut(last_idx).unwrap();

        if current_timestamp - last_entry.timestamp >= ONE_DAY {
            let stats = Statistics {
                prod,
                timestamp: current_timestamp,
            };

            state.statistics.push(stats);
        } else {
            last_entry.prod.merge(prod);
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
