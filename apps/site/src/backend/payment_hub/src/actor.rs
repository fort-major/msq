use candid::CandidType;
use exchange_rates::{refresh_exchange_rates, ExchangeRatesState, EXCHANGE_RATES};
use ic_cdk::{
    init, post_upgrade, pre_upgrade, spawn,
    storage::{stable_restore, stable_save},
};
use icrc_ledger_types::icrc1::account::Account;
use invoices::{init_invoice_ids_seed, InvoicesState, INVOICES_STATE};
use serde::Deserialize;
use shops::{ShopsState, SHOPS_STATE};
use timers::init_timers;
use tokens::{init_supported_tokens, SupportedTokensState, Token, SUPPORTED_TOKENS};
use utils::set_immediate;

mod exchange_rates;
mod invoices;
mod shops;
mod timers;
mod tokens;
mod utils;

#[derive(CandidType, Deserialize)]
struct InitArgs {
    supported_tokens: Vec<Token>,
    fee_collector_account: Option<Account>,
}

#[init]
fn init_hook(args: InitArgs) {
    SHOPS_STATE.with_borrow_mut(|s| s.set_fee_collector_account(args.fee_collector_account));

    init_timers();
    init_supported_tokens(args.supported_tokens);

    set_immediate(|| {
        spawn(refresh_exchange_rates());
        spawn(init_invoice_ids_seed());
    });
}

#[pre_upgrade]
fn pre_upgrade_hook() {
    SUPPORTED_TOKENS.with_borrow(|supported_tokens| {
        EXCHANGE_RATES.with_borrow(|exchange_rates| {
            INVOICES_STATE.with_borrow(|invoices_state| {
                SHOPS_STATE.with_borrow(|shops_state| {
                    stable_save((
                        supported_tokens,
                        exchange_rates,
                        invoices_state,
                        shops_state,
                    ))
                    .expect("Unable to stable_save");
                })
            })
        })
    });
}

#[post_upgrade]
fn post_upgrade_hook() {
    let (supported_tokens, exchange_rates, invoices, shops_state): (
        SupportedTokensState,
        ExchangeRatesState,
        InvoicesState,
        ShopsState,
    ) = stable_restore().expect("Unable to stable_restore");

    SUPPORTED_TOKENS.with_borrow_mut(|it| *it = supported_tokens);
    EXCHANGE_RATES.with_borrow_mut(|it| *it = exchange_rates);
    INVOICES_STATE.with_borrow_mut(|it| *it = invoices);
    SHOPS_STATE.with_borrow_mut(|it| *it = shops_state);

    init_timers();

    set_immediate(|| {
        spawn(refresh_exchange_rates());
        spawn(init_invoice_ids_seed());
    });
}
