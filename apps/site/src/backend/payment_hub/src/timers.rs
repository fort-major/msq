use std::{cell::RefCell, time::Duration as StdDuration};

use chrono::{Datelike, Days, Duration, TimeZone, Utc};
use ic_cdk::{api::time, spawn};
use ic_cdk_timers::{set_timer, set_timer_interval, TimerId};

use crate::{exchange_rates::refresh_exchange_rates, invoices::garbage_collect_invoices};

struct Timers {
    // fires each day at 2AM UTC - timer
    exchange_rates_fetch: TimerId,

    // fires each 10 minutes - interval
    discard_expired_invoices: TimerId,
}

// ------------------------ STATE -------------------------

thread_local! {
    static TIMERS: RefCell<Option<Timers>> = RefCell::default();
}

pub fn init_timers() {
    let now = time();
    let now_utc = Utc.timestamp_nanos(now as i64);

    let todays_2am_utc = Utc
        .with_ymd_and_hms(now_utc.year(), now_utc.month(), now_utc.day(), 2, 0, 0)
        .unwrap();

    let next_2am_utc = if now_utc < todays_2am_utc {
        todays_2am_utc
    } else {
        todays_2am_utc + Days::new(1)
    };

    let exchange_rates_fetch_delay =
        StdDuration::from_nanos((next_2am_utc - now_utc).num_nanoseconds().unwrap() as u64);
    let discard_expired_invoices_delay = Duration::minutes(10).to_std().unwrap();

    let timers = Timers {
        exchange_rates_fetch: set_timer(
            exchange_rates_fetch_delay,
            handle_exchange_rates_fetch_timer,
        ),
        discard_expired_invoices: set_timer_interval(
            discard_expired_invoices_delay,
            handle_discard_expired_invoices_interval,
        ),
    };

    TIMERS.with(|t| t.replace(Some(timers)));
}

fn handle_exchange_rates_fetch_timer() {
    // should be around 2AM UTC
    let now_utc = Utc.timestamp_nanos(time() as i64);

    let tomorrow_2am_utc = Utc
        .with_ymd_and_hms(now_utc.year(), now_utc.month(), now_utc.day(), 2, 0, 0)
        .unwrap()
        + Days::new(1);

    let delay =
        StdDuration::from_nanos((tomorrow_2am_utc - now_utc).num_nanoseconds().unwrap() as u64);

    TIMERS.with_borrow_mut(|t| {
        let timers_ref = t.as_mut().unwrap();

        timers_ref.exchange_rates_fetch = set_timer(delay, handle_exchange_rates_fetch_timer);
    });

    spawn(refresh_exchange_rates());
}

#[inline]
fn handle_discard_expired_invoices_interval() {
    garbage_collect_invoices();
}
