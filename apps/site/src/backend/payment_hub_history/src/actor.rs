use std::cell::RefCell;

use borsh::{from_slice, to_vec};
use candid::CandidType;
use ic_cdk::{
    api::stable::{stable64_read, stable64_write},
    caller, init, post_upgrade, pre_upgrade, query, update,
};
use serde::Deserialize;
use utils::{unwrap_shop_certificate, BorshPrincipal, PaidInvoice, RawShopCertificate, State};

mod utils;

thread_local! {
    static STATE: RefCell<Option<State>> = RefCell::new(None);
}

#[derive(CandidType, Deserialize)]
struct InitArgs {
    pub offset: u64,
    pub parent: BorshPrincipal,
}

#[init]
fn init_hook(args: InitArgs) {
    STATE.with(|it| {
        it.borrow_mut()
            .replace(State::init(args.offset, args.parent))
    });
}

#[pre_upgrade]
fn pre_upgrade_hook() {
    let buf = STATE.with(|it| {
        let state_opt_ref = it.borrow();
        to_vec(state_opt_ref.as_ref().expect("State not found")).expect("Unable to serialize state")
    });

    let mut size_arr = [0u8; 8];
    size_arr.copy_from_slice(&buf.len().to_le_bytes());

    stable64_write(0, &size_arr);
    stable64_write(8, &buf);
}

#[post_upgrade]
fn post_upgrade_hook() {
    let mut size_arr = [0u8; 8];
    stable64_read(0, &mut size_arr);

    let size = usize::from_le_bytes(size_arr);
    let mut buf = vec![0u8; size];

    stable64_read(8, &mut buf);

    let state: State = from_slice(&buf).expect("Unable to deserialize state");

    STATE.with(|it| it.borrow_mut().replace(state));
}

#[derive(CandidType, Deserialize)]
pub struct PushBatchRequest {
    pub batch: Vec<PaidInvoice>,
}

#[update(guard=only_parent)]
fn push_batch(req: PushBatchRequest) {
    STATE.with(|it| {
        let mut state_opt_ref = it.borrow_mut();
        let state = state_opt_ref.as_mut().unwrap();

        state.log.extend(req.batch);
    });
}

#[derive(CandidType, Deserialize)]
pub struct GetInvoiceRequest {
    pub idx: u64,
    pub shop_cert: RawShopCertificate,
}

pub type GetInvoiceResponse = Result<PaidInvoice, BorshPrincipal>;

#[query]
fn get_invoice(req: GetInvoiceRequest) -> GetInvoiceResponse {
    STATE.with(|it| {
        let state_opt_ref = it.borrow();
        let state = state_opt_ref.as_ref().unwrap();

        if req.idx < state.offset {
            Err(state.next.expect("Could not find the next shard"))
        } else {
            let entry = state
                .log
                .get((req.idx - state.offset) as usize)
                .expect("Index too big");

            let expected_shop_id = unwrap_shop_certificate(&req.shop_cert);

            assert_eq!(
                entry.shop_id, expected_shop_id,
                "Only sellers can access their own invoice data"
            );

            Ok(entry.clone())
        }
    })
}

#[derive(CandidType, Deserialize)]
pub struct SetNextRequest {
    next: BorshPrincipal,
}

#[update(guard=only_parent)]
fn set_next(req: SetNextRequest) {
    STATE.with(|it| {
        let mut state_opt_ref = it.borrow_mut();
        let state = state_opt_ref.as_mut().unwrap();

        state.next = Some(req.next);
    });
}

fn only_parent() -> Result<(), String> {
    STATE.with(|it| {
        let mut state_opt_ref = it.borrow_mut();
        let state = state_opt_ref.as_mut().unwrap();

        if caller() == state.parent.0 {
            Ok(())
        } else {
            Err(String::from("Access denied"))
        }
    })
}
