use candid::{CandidType, Principal};
use ic_cdk::{
    api::call::CallResult,
    caller, init, post_upgrade, pre_upgrade, query,
    storage::{stable_restore, stable_save},
    update,
};
use ic_ledger_types::{
    query_archived_blocks, query_blocks, AccountIdentifier, Block, BlockIndex, GetBlocksArgs,
    Operation, Subaccount, Tokens,
};
use serde::Deserialize;
use std::{cell::RefCell, collections::HashMap};

const ICP_TOKEN_ID: &str = "ryjl3-tyaaa-aaaaa-aaaba-cai";
const RECIPIENT_PRINCIPAL: &str = "6xqad-ivesr-pbpu5-3g5ka-3piah-uvuk2-buwfp-enqaa-p64lr-y7sdi-sqe";

#[derive(Clone, Copy, CandidType, Deserialize)]
enum OrderStatus {
    Created,
    PendingPayment,
    Paid,
    Canceled,
}

type OrderId = u64;

#[derive(Clone, CandidType, Deserialize)]
struct Order {
    id: OrderId,
    qty: u32,
    price: Tokens,
    status: OrderStatus,
    buyer: Principal,
}

#[derive(CandidType, Deserialize)]
struct State {
    plushies_in_stock: u32,
    price: Tokens,
    payment_token_id: Principal,
    order_id_counter: u64,
    orders: HashMap<OrderId, Order>,
}

thread_local! {
    static STATE: RefCell<Option<State>> = RefCell::default();
}

#[init]
fn init_hook() {
    STATE.with(|it| {
        it.replace(Some(State {
            plushies_in_stock: 1000,
            price: Tokens::from_e8s(10_000_000), // 0.1 ICP
            payment_token_id: Principal::from_text(ICP_TOKEN_ID).unwrap(),
            order_id_counter: 0,
            orders: HashMap::new(),
        }));
    });
}

#[pre_upgrade]
fn pre_upgrade_hook() {
    let state = STATE.with(|it| it.replace(Option::None));
    stable_save((state,)).expect("Unable to save to stable memory");
}

#[post_upgrade]
fn post_upgrade_hook() {
    let (state,): (Option<State>,) =
        stable_restore().expect("Unable to restore from stable memory");

    STATE.with(|it| it.replace(state));
}

#[update]
fn create_order(qty: u32) -> OrderId {
    STATE.with(|it| {
        let mut state_ref = it.borrow_mut();
        let state = state_ref.as_mut().unwrap();

        if state.plushies_in_stock < qty {
            panic!("Out of stock");
        }

        state.plushies_in_stock -= qty;

        let order_id = state.order_id_counter;
        state.order_id_counter += 1;
        let order = Order {
            id: order_id,
            qty,
            price: state.price.clone(),
            status: OrderStatus::Created,
            buyer: caller(),
        };

        state.orders.insert(order_id, order);

        order_id
    })
}

#[query]
fn get_order(order_id: OrderId) -> Order {
    STATE.with(|it| {
        let state_ref = it.borrow();
        let state = state_ref.as_ref().unwrap();

        state.orders.get(&order_id).cloned().unwrap()
    })
}

#[update]
fn cancel_order(order_id: OrderId) {
    STATE.with(|it| {
        let mut state_ref = it.borrow_mut();
        let state = state_ref.as_mut().unwrap();

        let order = state.orders.get_mut(&order_id).unwrap();

        if order.buyer != caller() {
            panic!("Access Denied");
        }

        if !matches!(order.status, OrderStatus::Created) {
            panic!("Invalid Operation")
        }

        order.status = OrderStatus::Canceled;
    });
}

#[update]
async fn complete_order(order_id: OrderId, block_number: u64) {
    let token_id = STATE.with(|it| {
        let mut state_ref = it.borrow_mut();
        let state = state_ref.as_mut().unwrap();

        let order = state.orders.get_mut(&order_id).unwrap();

        if order.buyer != caller() {
            panic!("Access Denied");
        }

        if !matches!(order.status, OrderStatus::Created) {
            panic!("Invalid Operation")
        }

        order.status = OrderStatus::PendingPayment;

        state.payment_token_id
    });

    let result = query_one_block(token_id, block_number).await;

    match result {
        Ok(block_opt) => {
            if let Some(block) = block_opt {
                if block.transaction.memo.0 != order_id {
                    panic!("Transaction memo doesn't match order id");
                }

                let op = block.transaction.operation.unwrap();
                let recipient_account_id = AccountIdentifier::new(
                    &Principal::from_text(RECIPIENT_PRINCIPAL).unwrap(),
                    &Subaccount([0u8; 32]),
                );

                match op {
                    Operation::Transfer {
                        from: _,
                        to,
                        amount,
                        fee: _,
                    } => {
                        if to != recipient_account_id {
                            panic!("Invalid recipient! {} expected", recipient_account_id);
                        }

                        STATE.with(|it| {
                            let mut state_ref = it.borrow_mut();
                            let state = state_ref.as_mut().unwrap();

                            let order = state.orders.get_mut(&order_id).unwrap();

                            if amount.e8s() < order.price.e8s() {
                                panic!(
                                    "Insufficient transfer! {} expected - {} received",
                                    order.price, amount
                                );
                            }

                            order.status = OrderStatus::Paid;
                        })
                    }
                    Operation::TransferFrom {
                        from: _,
                        to,
                        spender: _,
                        amount,
                        fee: _,
                    } => {
                        if to != recipient_account_id {
                            panic!("Invalid recipient! {} expected", recipient_account_id);
                        }

                        STATE.with(|it| {
                            let mut state_ref = it.borrow_mut();
                            let state = state_ref.as_mut().unwrap();

                            let order = state.orders.get_mut(&order_id).unwrap();

                            if amount.e8s() < order.price.e8s() {
                                panic!(
                                    "Insufficient transfer! {} expected - {} received",
                                    order.price, amount
                                );
                            }

                            order.status = OrderStatus::Paid;
                        })
                    }
                    _ => panic!("Invalid block operation. Should be 'transfer' or 'transfer_from'"),
                }
            } else {
                panic!("No block found")
            }
        }
        Err(e) => panic!("Unable to call to a remote canister {:?}", e),
    }
}

async fn query_one_block(ledger: Principal, block_index: BlockIndex) -> CallResult<Option<Block>> {
    let args = GetBlocksArgs {
        start: block_index,
        length: 1,
    };

    let blocks_result = query_blocks(ledger, args.clone()).await?;

    if blocks_result.blocks.len() >= 1 {
        debug_assert_eq!(blocks_result.first_block_index, block_index);
        return Ok(blocks_result.blocks.into_iter().next());
    }

    if let Some(func) = blocks_result.archived_blocks.into_iter().find_map(|b| {
        (b.start <= block_index && (block_index - b.start) < b.length).then(|| b.callback)
    }) {
        match query_archived_blocks(&func, args).await? {
            Ok(range) => return Ok(range.blocks.into_iter().next()),
            _ => (),
        }
    }
    Ok(None)
}
