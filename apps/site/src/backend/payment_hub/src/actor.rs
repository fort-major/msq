use ic_cdk::init;
use timers::init_timers;

mod timers;
mod utils;

#[init]
fn init_hook() {
    init_timers();
}
