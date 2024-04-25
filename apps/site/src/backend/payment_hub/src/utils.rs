use std::time::Duration;

use ic_cdk_timers::set_timer;

pub fn set_immediate(func: impl FnOnce() + 'static) {
    set_timer(Duration::ZERO, func);
}

pub type ExchangeRates = u64;

pub async fn fetch_exchange_rates() -> ExchangeRates {
    return 0;
}
