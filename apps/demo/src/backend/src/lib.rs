use candid::{CandidType, Nat, Principal};
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
use std::{
    cell::RefCell,
    collections::{hash_map::Entry, HashMap},
};

const ICP_TOKEN_ID: &str = "ryjl3-tyaaa-aaaaa-aaaba-cai";
const RECIPIENT_PRINCIPAL: &str = "rmapb-pzxbf-4fimd-h33qy-aydfx-wxne6-64kqi-f6nwz-cfzyq-wf7tb-bqe";

#[derive(Clone, Copy, CandidType, Deserialize)]
enum OrderStatus {
    Created,
    PendingPayment,
    Paid,
    Canceled,
}

type OrderId = Nat;

#[derive(Clone, CandidType, Deserialize)]
struct Order {
    id: OrderId,
    memo: Vec<u8>,
    qty: u32,
    price: u64,
    total: Nat,
    status: OrderStatus,
    buyer: Principal,
}

#[derive(CandidType, Deserialize)]
struct State {
    plushies_in_stock: u32,
    price: Tokens,
    payment_token_id: Principal,
    order_id_counter: OrderId,
    orders: HashMap<OrderId, Order>,
    orders_by_owner: HashMap<Principal, Vec<OrderId>>,
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
            order_id_counter: Nat::from(0),
            orders: HashMap::new(),
            orders_by_owner: HashMap::new(),
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

        let order_id = state.order_id_counter.clone();
        state.order_id_counter += Nat::from(1);
        let order = Order {
            id: order_id.clone(),
            memo: order_id.0.to_bytes_le(),
            qty,
            total: Nat::from(qty) * Nat::from(state.price.e8s()),
            price: state.price.e8s(),
            status: OrderStatus::Created,
            buyer: caller(),
        };

        state.orders.insert(order_id.clone(), order);

        match state.orders_by_owner.entry(caller()) {
            Entry::Vacant(e) => {
                e.insert(vec![order_id.clone()]);
            }
            Entry::Occupied(mut e) => {
                e.get_mut().push(order_id.clone());
            }
        }

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

#[query]
fn get_my_order_ids() -> Vec<OrderId> {
    STATE.with(|it| {
        it.borrow()
            .as_ref()
            .map(|it| {
                it.orders_by_owner
                    .get(&caller())
                    .cloned()
                    .unwrap_or_default()
            })
            .unwrap_or_default()
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
                if block.transaction.icrc1_memo.unwrap() != order_id.0.to_bytes_le() {
                    panic!("Transaction memo doesn't match order id");
                }

                match block.transaction.operation.unwrap() {
                    Operation::Transfer {
                        from: _,
                        to,
                        amount,
                        fee: _,
                    } => process_txn(order_id, to, amount),
                    Operation::TransferFrom {
                        from: _,
                        to,
                        spender: _,
                        amount,
                        fee: _,
                    } => process_txn(order_id, to, amount),
                    _ => panic!("Invalid block operation. Should be 'transfer' or 'transfer_from'"),
                };
            } else {
                panic!("No block found")
            }
        }
        Err(e) => panic!("Unable to call to a remote canister {:?}", e),
    }
}

fn process_txn(order_id: OrderId, to: AccountIdentifier, amount: Tokens) {
    let recipient_account_id = AccountIdentifier::new(
        &Principal::from_text(RECIPIENT_PRINCIPAL).unwrap(),
        &Subaccount([0u8; 32]),
    );

    if to != recipient_account_id {
        panic!("Invalid recipient! {} expected", recipient_account_id);
    }

    STATE.with(|it| {
        let mut state_ref = it.borrow_mut();
        let state = state_ref.as_mut().unwrap();

        let order = state.orders.get_mut(&order_id).unwrap();

        if Nat::from(amount.e8s()) < order.total {
            panic!(
                "Insufficient transfer! {} expected - {} received",
                order.total, amount
            );
        }

        order.status = OrderStatus::Paid;
    })
}

async fn query_one_block(ledger: Principal, block_index: BlockIndex) -> CallResult<Option<Block>> {
    let args = GetBlocksArgs {
        start: block_index,
        length: 1,
    };

    let blocks_result = query_blocks(ledger, args.clone()).await.unwrap();

    if blocks_result.blocks.len() >= 1 {
        debug_assert_eq!(blocks_result.first_block_index, block_index);
        return Ok(blocks_result.blocks.into_iter().next());
    }

    if let Some(func) = blocks_result.archived_blocks.into_iter().find_map(|b| {
        (b.start <= block_index && (block_index - b.start) < b.length).then(|| b.callback)
    }) {
        match query_archived_blocks(&func, args).await.unwrap() {
            Ok(range) => return Ok(range.blocks.into_iter().next()),
            _ => (),
        }
    }
    Ok(None)
}
