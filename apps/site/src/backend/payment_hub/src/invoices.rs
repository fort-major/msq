use std::{
    cell::RefCell,
    collections::{hash_map::Entry, BTreeMap, BTreeSet, HashMap},
};

use candid::{CandidType, Nat, Principal};
use ic_cdk::{
    api::{management_canister::main::raw_rand, time},
    call, caller, id, query, spawn, update,
};
use icrc_ledger_types::{icrc1::account::Account, icrc3::blocks::GetBlocksRequest};
use serde::Deserialize;

use crate::{
    exchange_rates::{get_current_exchange_rate_timestamp, ExchangeRatesState, EXCHANGE_RATES},
    tokens::{SupportedTokensState, TokenId, SUPPORTED_TOKENS},
    utils::{
        calc_shop_subaccount, icrc3_block_to_transfer_txn, perform_refund, ErrorCode,
        ICRC1CanisterClient, InvoiceId, ShopId, Timestamp, TransferTxn, DEFAULT_TTL,
        ID_GENERATION_DOMAIN, MEMO_GENERATION_DOMAIN, RECYCLING_TTL, USD,
    },
};

pub type CorrelationId = [u8; 32];

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum InvoiceStatus {
    Created {
        ttl: u8,
    },
    Paid {
        timestamp: Timestamp,
        token_id: TokenId,
        qty: Nat,
        exchange_rate: USD,
    },
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum InvoiceNotificationMethod {
    HttpOutcall {
        hostname: String,
        manual: Option<Vec<u8>>,
    },
    InterCanisterCall {
        canister_id: Principal,
        manual: Option<Vec<u8>>,
    },
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Invoice {
    pub status: InvoiceStatus,
    pub qty_usd: Nat,
    pub created_at: u64,
    pub exchange_rates_timestamp: Timestamp,
    pub shop_id: ShopId,
    pub correlation_id: CorrelationId,
    pub notification_method: InvoiceNotificationMethod,
    pub is_notified: bool,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct Refund {
    pub token_id: TokenId,
    pub from: Account,
    pub to: Account,
    pub qty: Nat,
    pub reason: String,
}

#[derive(Default, CandidType, Deserialize, Clone, Debug)]
pub struct InvoicesState {
    pub invoice_id_generator: InvoiceId,

    pub invoices: BTreeMap<InvoiceId, Invoice>,

    pub active_invoices: HashMap<Timestamp, BTreeSet<InvoiceId>>,
    pub paid_invoices: BTreeSet<InvoiceId>,

    pub notified_invoices: Vec<Invoice>,
    pub total_processed_in_usd: USD,
}

impl InvoicesState {
    #[inline]
    pub fn init_id_seed(&mut self, seed: &[u8]) {
        self.invoice_id_generator.copy_from_slice(seed);
    }

    pub fn create(
        &mut self,
        qty_usd: Nat,
        shop_id: ShopId,
        timestamp: u64,
        correlation_id: CorrelationId,
        notification_method: InvoiceNotificationMethod,
    ) -> InvoiceId {
        let inv = Invoice {
            status: InvoiceStatus::Created { ttl: DEFAULT_TTL },
            qty_usd,
            exchange_rates_timestamp: get_current_exchange_rate_timestamp(),
            created_at: timestamp,
            shop_id,
            is_notified: false,
            notification_method,
            correlation_id,
        };

        let id = self.generate_id(&timestamp.to_le_bytes());

        match self.active_invoices.entry(inv.exchange_rates_timestamp) {
            Entry::Occupied(mut e) => {
                e.get_mut().insert(id);
            }
            Entry::Vacant(e) => {
                let mut s = BTreeSet::new();
                s.insert(id);

                e.insert(s);
            }
        }

        self.invoices.insert(id, inv);

        id
    }

    pub fn purge_expired(&mut self, exchange_rates_state: &mut ExchangeRatesState) {
        let mut purged_invoices = HashMap::new();

        for (exchange_rates_timestamp, active_invoices) in self.active_invoices.iter() {
            let mut cur_purged_invoices = Vec::new();

            for id in active_invoices {
                let mut remove = false;

                {
                    let invoice = self.invoices.get_mut(id).unwrap();

                    if let InvoiceStatus::Created { ttl } = invoice.status {
                        if ttl > RECYCLING_TTL {
                            invoice.status = InvoiceStatus::Created { ttl: ttl - 1 };
                        } else {
                            remove = true;
                        }
                    } else {
                        unreachable!("Invoice should be in Created state");
                    }
                }

                if remove {
                    self.invoices.remove(id);
                    cur_purged_invoices.push(*id);
                }
            }

            purged_invoices.insert(*exchange_rates_timestamp, cur_purged_invoices);
        }

        for (exchange_rates_timestamp, invoices) in purged_invoices {
            let mut remove = false;

            {
                let active_invoices = self
                    .active_invoices
                    .get_mut(&exchange_rates_timestamp)
                    .unwrap();

                for id in invoices {
                    active_invoices.remove(&id);
                }

                if active_invoices.is_empty() {
                    remove = true;
                }
            }

            if remove {
                self.active_invoices.remove(&exchange_rates_timestamp);
                exchange_rates_state.delete_outdated(&exchange_rates_timestamp);
            }
        }
    }

    // TODO: implement overpaid refund
    // TODO: IMPORTANT!!!!! Implement protection against malicious refunds!
    pub fn pay(
        &mut self,
        invoice_id: &InvoiceId,
        transfer_txn: TransferTxn,
        exchange_rates_state: &mut ExchangeRatesState,
        supported_tokens_state: &SupportedTokensState,
        this_canister_id: Principal,
    ) -> Result<Invoice, Result<Refund, String>> {
        let invoice = self
            .invoices
            .get_mut(invoice_id)
            .ok_or(Err("Invoice not found".to_string()))?;

        if !matches!(invoice.status, InvoiceStatus::Created { ttl: _ }) {
            return Err(Err("Invoice already paid".to_string()));
        }

        // is memo valid
        let expected_memo = Self::make_invoice_memo(invoice_id);
        let actual_memo = transfer_txn.memo;

        if expected_memo != actual_memo {
            return Err(Err(format!(
                "Txn memo field doesn't match the invoice one: expected {:?}, actual {:?}",
                expected_memo, actual_memo
            )));
        }

        // check if the sum sent is enough to cover the invoice
        let exchange_rate = EXCHANGE_RATES.with(|it| {
            transfer_txn.get_implied_exchange_rate(
                &it.borrow(),
                invoice.exchange_rates_timestamp,
                supported_tokens_state,
            )
        });

        let expected_qty_usd = invoice.qty_usd;
        let actual_qty_usd = exchange_rate.clone() * transfer_txn.qty.clone();

        if actual_qty_usd < invoice.qty_usd {
            return Err(Ok(Self::create_refund_result(
                transfer_txn,
                format!(
                    "Insufficient transfer: expected (usd e8s) {}, actual (usd e8s) {}",
                    expected_qty_usd, actual_qty_usd
                ),
            )));
        }

        // check if the transfer was sent to the correct recepient
        let expected_recepient_principal = this_canister_id;
        let actual_recepient_principal = transfer_txn.to.owner;

        if expected_recepient_principal != actual_recepient_principal {
            return Err(Err(format!(
                "Invalid recepient - funds are lost: expected {}, actual {}",
                expected_recepient_principal, actual_recepient_principal
            )));
        }

        let expected_shop_subaccount = calc_shop_subaccount(invoice.shop_id);
        let actual_shop_subaccount = transfer_txn.to.subaccount.unwrap_or([0u8; 32]);

        if actual_shop_subaccount != expected_shop_subaccount {
            return Err(Ok(Self::create_refund_result(
                transfer_txn,
                format!(
                    "Invalid recepient subaccount: expected {:?}, actual {:?}",
                    expected_shop_subaccount, actual_shop_subaccount
                ),
            )));
        }

        // everything is okay, update invoice status
        invoice.status = InvoiceStatus::Paid {
            timestamp: time(),
            token_id: transfer_txn.token_id,
            exchange_rate,
            qty: transfer_txn.qty,
        };

        // delete the invoice from the list of active invoices (which is segregated by exchange rate used)
        let active_invoices = self
            .active_invoices
            .get_mut(&invoice.exchange_rates_timestamp)
            .unwrap();
        active_invoices.remove(invoice_id);

        // if the active invoice list is empty now - delete the outdated exchange rates
        if active_invoices.is_empty() {
            exchange_rates_state.delete_outdated(&invoice.exchange_rates_timestamp);
        }

        // move the invoice to paid list
        self.paid_invoices.insert(*invoice_id);

        Ok(invoice.clone())
    }

    pub fn set_notified(&mut self, id: &InvoiceId) -> usize {
        let mut invoice = self.invoices.remove(id).expect("Invoice not found");

        if invoice.is_notified {
            panic!("Invalid invoice state");
        }

        invoice.is_notified = true;
        self.paid_invoices.remove(id);

        self.total_processed_in_usd += invoice.qty_usd.clone();
        self.notified_invoices.push(invoice);

        return self.notified_invoices.len() - 1;
    }

    fn create_refund_result(transfer_txn: TransferTxn, reason: String) -> Refund {
        return Refund {
            token_id: transfer_txn.token_id,
            from: transfer_txn.from,
            to: transfer_txn.to,
            qty: transfer_txn.qty,
            reason,
        };
    }

    fn generate_id(&mut self, salt: &[u8]) -> InvoiceId {
        blake3::Hasher::new()
            .update(&self.invoice_id_generator)
            .update(ID_GENERATION_DOMAIN)
            .update(salt)
            .finalize()
            .into()
    }

    fn make_invoice_memo(id: &InvoiceId) -> [u8; 32] {
        blake3::Hasher::new()
            .update(MEMO_GENERATION_DOMAIN)
            .update(id)
            .finalize()
            .into()
    }
}

// --------------------------- STATE ------------------------

thread_local! {
    pub static INVOICES_STATE: RefCell<InvoicesState> = RefCell::default();
}

#[inline]
pub fn garbage_collect_invoices() {
    INVOICES_STATE.with_borrow_mut(|s| {
        EXCHANGE_RATES.with(|rates| s.purge_expired(&mut rates.borrow_mut()));
    });
}

#[inline]
pub async fn init_invoice_ids_seed() {
    let (rand,) = raw_rand().await.unwrap();

    INVOICES_STATE.with_borrow_mut(|it| it.init_id_seed(&rand));
}

// ----------------------- API -------------------------

#[derive(CandidType, Deserialize)]
pub struct GetInvoiceRequest {
    pub invoice_id: InvoiceId,
}

#[derive(CandidType, Deserialize)]
pub struct GetInvoiceResponse {
    pub invoice_opt: Option<Invoice>,
}

#[query]
fn get_invoice(req: GetInvoiceRequest) -> GetInvoiceResponse {
    let invoice_opt = INVOICES_STATE.with_borrow(|it| it.invoices.get(&req.invoice_id).cloned());

    GetInvoiceResponse { invoice_opt }
}

#[derive(CandidType, Deserialize)]
pub struct CreateInvoiceRequest {
    pub qty_usd: USD,
    pub correlation_id: CorrelationId,
    pub notification_method: InvoiceNotificationMethod,
}

#[derive(CandidType, Deserialize)]
pub struct CreateInvoiceResponse {
    pub invoice_id: InvoiceId,
}

#[update]
fn create_invoice(req: CreateInvoiceRequest) -> CreateInvoiceResponse {
    // TODO: check if caller is in shop's invoice creator list

    let invoice_id = INVOICES_STATE.with_borrow_mut(|it| {
        it.create(
            req.qty_usd,
            shop_id,
            time(),
            req.correlation_id,
            req.notification_method,
        )
    });

    CreateInvoiceResponse { invoice_id }
}

#[derive(CandidType, Deserialize)]
pub struct PayRequest {
    pub invoice_id: InvoiceId,
    pub asset_id: Principal,
    pub block_idx: Nat,
}

#[derive(CandidType, Deserialize)]
pub struct PayResponse {
    pub result: Result<Invoice, String>,
}

/**
 * Refund conditions:
 *  1. Passed transaction is a valid transfer transaction
 *  2. The transaction sends funds to this canister (subaccount may vary, but the principal is the same)
 *  3. The invoice exists and is active (not paid yet)
 *  4. The invoice is referenced from within the transaction's memo field
 */
#[update]
async fn pay(req: PayRequest) -> PayResponse {
    let token = ICRC1CanisterClient::new(req.asset_id);
    let (mut get_blocks_result,) = token
        .icrc3_get_blocks(GetBlocksRequest {
            start: req.block_idx.clone(),
            length: Nat::from(1u64),
        })
        .await
        .expect(&format!(
            "Unable to fetch ICRC3 blocks of token {}",
            req.asset_id
        ));

    if get_blocks_result.log_length < req.block_idx {
        panic!(
            "Block {} does not exist (total block len {})",
            req.block_idx, get_blocks_result.log_length
        );
    }

    // loop over archives until the block is found
    while get_blocks_result.blocks.get(0).is_none() {
        let archive = get_blocks_result
            .archived_blocks
            .get(0)
            .expect("No good archive found for the block");

        (get_blocks_result,) = call(
            archive.callback.canister_id,
            &archive.callback.method,
            (GetBlocksRequest {
                start: req.block_idx.clone(),
                length: Nat::from(1u64),
            },),
        )
        .await
        .expect(&format!(
            "Unable to fetch ICRC3 blocks of token {}",
            req.asset_id
        ))
    }

    let block = get_blocks_result.blocks.get(0).unwrap();
    if block.id != req.block_idx {
        unreachable!("Invalid block id from an ICRC-3 ledger");
    }

    let txn = icrc3_block_to_transfer_txn(block, req.asset_id).expect("Unable to parse block");

    let result = INVOICES_STATE
        .with_borrow_mut(|invoices_state| {
            EXCHANGE_RATES.with_borrow_mut(|exchange_rates_state| {
                SUPPORTED_TOKENS.with_borrow(|supported_tokens| {
                    invoices_state.pay(
                        &req.invoice_id,
                        txn,
                        exchange_rates_state,
                        &supported_tokens,
                        id(),
                    )
                })
            })
        })
        .map_err(|e| match e {
            Ok(refund_info) => {
                let reason = refund_info.reason.clone();
                spawn(perform_refund(refund_info));

                reason
            }
            Err(err) => err,
        });

    PayResponse { result }
}
