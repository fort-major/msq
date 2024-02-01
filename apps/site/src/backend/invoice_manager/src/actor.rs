mod invoice;

use std::cell::RefCell;

use candid::{CandidType, Deserialize, Nat};
use ic_cdk::{
    api::time,
    init, post_upgrade, pre_upgrade, query,
    storage::{stable_restore, stable_save},
    update,
};

#[derive(Default, CandidType, Deserialize)]
struct State {
    invoices: ,
}

thread_local! {
    static STATE: RefCell<Option<State>> = RefCell::default();
}

