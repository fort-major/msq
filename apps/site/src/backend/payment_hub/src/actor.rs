use candid::CandidType;
use exchange_rates::{refresh_exchange_rates, ExchangeRatesState, EXCHANGE_RATES};
use ic_cdk::{
    init, post_upgrade, pre_upgrade, spawn,
    storage::{stable_restore, stable_save},
};
use serde::Deserialize;
use timers::init_timers;
use tokens::{init_supported_tokens, SupportedTokensState, Token, SUPPORTED_TOKENS};
use utils::set_immediate;

mod exchange_rates;
mod invoices;
mod timers;
mod tokens;
mod utils;

// TODO: add error logging - you can log to some log, periodically read with off-chain server and erase
// TODO: validate all inputs for UB
// TODO: protect methods with controller protection

#[derive(CandidType, Deserialize)]
struct InitArgs {
    supported_tokens: Vec<Token>,
}

#[init]
fn init_hook(args: InitArgs) {
    init_timers();
    init_supported_tokens(args.supported_tokens);

    set_immediate(|| spawn(refresh_exchange_rates()))
}

#[pre_upgrade]
fn pre_upgrade_hook() {
    let supported_tokens = SUPPORTED_TOKENS.with(|it| it.borrow().clone());
    let exchange_rates = EXCHANGE_RATES.with(|it| it.borrow().clone());

    stable_save((supported_tokens, exchange_rates)).expect("Unable to stable_save");
}

#[post_upgrade]
fn post_upgrade_hook() {
    init_timers();

    let (supported_tokens, exchange_rates): (SupportedTokensState, ExchangeRatesState) =
        stable_restore().expect("Unable to stable_restore");

    SUPPORTED_TOKENS.with(|it| it.replace(supported_tokens));
    EXCHANGE_RATES.with(|it| it.replace(exchange_rates));

    set_immediate(|| spawn(refresh_exchange_rates()));
}
