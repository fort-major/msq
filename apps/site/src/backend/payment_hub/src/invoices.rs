use std::{
    cell::RefCell,
    collections::{hash_map::Entry, BTreeMap, BTreeSet, HashMap},
};

use candid::{CandidType, Nat};
use ic_cdk::{
    api::{management_canister::main::raw_rand, time},
    caller, id, query, spawn, update,
};
use serde::Deserialize;

use crate::{
    exchange_rates::{get_current_exchange_rate_timestamp, ExchangeRatesState, EXCHANGE_RATES},
    tokens::{SupportedTokensState, TokenId, SUPPORTED_TOKENS},
    utils::{
        calc_shop_subaccount, perform_refund, unwrap_cert_chain, unwrap_shop_cert, Account,
        ErrorCode, InvoiceId, RawPayCertificateChain, RawShopCert, ShopId, Timestamp, TransferTxn,
        DEFAULT_TTL, ERROR_INSUFFICIENT_FUNDS, ERROR_INVALID_INVOICE_STATUS, ERROR_INVALID_MEMO,
        ERROR_INVALID_RECEPIENT, ERROR_INVALID_TRANSACTION_CERT, ERROR_INVOICE_NOT_FOUND,
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
pub struct Invoice {
    pub state: InvoiceStatus,
    pub qty_usd: Nat,
    pub created_at: u64,
    pub exchange_rates_timestamp: Timestamp,
    pub shop_id: ShopId,
    pub correlation_id: CorrelationId,
    pub is_notified: bool,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct Refund {
    pub token_id: TokenId,
    pub from: Account,
    pub to: Account,
    pub qty: Nat,
    pub error_code: ErrorCode,
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
    ) -> InvoiceId {
        let inv = Invoice {
            state: InvoiceStatus::Created { ttl: DEFAULT_TTL },
            qty_usd,
            exchange_rates_timestamp: get_current_exchange_rate_timestamp(),
            created_at: timestamp,
            shop_id,
            is_notified: false,
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

                    if let InvoiceStatus::Created { ttl } = invoice.state {
                        if ttl > RECYCLING_TTL {
                            invoice.state = InvoiceStatus::Created { ttl: ttl - 1 };
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
    pub fn pay(
        &mut self,
        invoice_id: &InvoiceId,
        transfer_txn: TransferTxn,
        exchange_rates_state: &mut ExchangeRatesState,
        supported_tokens_state: &SupportedTokensState,
    ) -> Result<Invoice, Result<Refund, ErrorCode>> {
        let invoice = self
            .invoices
            .get_mut(invoice_id)
            .ok_or(Err(ERROR_INVOICE_NOT_FOUND))?;

        if !matches!(invoice.state, InvoiceStatus::Created { ttl: _ }) {
            return Err(Err(ERROR_INVALID_INVOICE_STATUS));
        }

        // is memo valid
        let expected_memo = Self::make_invoice_memo(invoice_id);
        if expected_memo != transfer_txn.memo {
            return Err(Err(ERROR_INVALID_MEMO));
        }

        // check if the sum sent is enough to cover the invoice
        let exchange_rate = EXCHANGE_RATES.with(|it| {
            transfer_txn.get_implied_exchange_rate(
                &it.borrow(),
                invoice.exchange_rates_timestamp,
                supported_tokens_state,
            )
        });

        if exchange_rate.clone() * transfer_txn.qty.clone() < invoice.qty_usd {
            return Err(Ok(Self::create_refund_result(
                transfer_txn,
                ERROR_INSUFFICIENT_FUNDS,
            )));
        }

        // check if the transfer was sent to the correct recepient
        let shop_subaccount = calc_shop_subaccount(invoice.shop_id);

        if transfer_txn.to.subaccount != shop_subaccount {
            return Err(Ok(Self::create_refund_result(
                transfer_txn,
                ERROR_INVALID_RECEPIENT,
            )));
        }

        // everything is okay, update invoice status
        invoice.state = InvoiceStatus::Paid {
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

    fn create_refund_result(transfer_txn: TransferTxn, error_code: u16) -> Refund {
        return Refund {
            token_id: transfer_txn.token_id,
            from: transfer_txn.from,
            to: transfer_txn.to,
            qty: transfer_txn.qty,
            error_code,
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
    pub shop_cert: RawShopCert,
    pub correlation_id: CorrelationId,
}

#[derive(CandidType, Deserialize)]
pub struct CreateInvoiceResponse {
    pub invoice_id: InvoiceId,
}

#[update]
fn create_invoice(req: CreateInvoiceRequest) -> CreateInvoiceResponse {
    let shop_id = unwrap_shop_cert(req.shop_cert);

    let invoice_id = INVOICES_STATE
        .with_borrow_mut(|it| it.create(req.qty_usd, shop_id, time(), req.correlation_id));

    CreateInvoiceResponse { invoice_id }
}

#[derive(CandidType, Deserialize)]
pub struct PayRequest {
    pub invoice_id: InvoiceId,
    pub cert_chain: RawPayCertificateChain,
}

pub type PayResponse = Result<Invoice, ErrorCode>;

/**
 * Refund conditions:
 *  1. Passed transaction is a valid transfer transaction
 *  2. The transaction sends funds to this canister (subaccount may vary, but the principal is the same)
 *  3. The invoice exists and is active (not paid yet)
 *  4. The invoice is referenced from within the transaction's memo field
 */
#[update]
fn pay(req: PayRequest) -> PayResponse {
    let txn = unwrap_cert_chain(&req.cert_chain).ok_or(ERROR_INVALID_TRANSACTION_CERT)?;

    if txn.to.principal_id != id() {
        return Err(ERROR_INVALID_RECEPIENT);
    }

    let result = INVOICES_STATE.with_borrow_mut(|invoices_state| {
        EXCHANGE_RATES.with_borrow_mut(|exchange_rates_state| {
            SUPPORTED_TOKENS.with_borrow(|supported_tokens| {
                invoices_state.pay(
                    &req.invoice_id,
                    txn,
                    exchange_rates_state,
                    &supported_tokens,
                )
            })
        })
    });

    // if everything is okay - respond with the invoice
    // if refund is possible - refund and respond with an error code
    // otherwise - no refund and respond with an error code
    match result {
        Ok(inv) => Ok(inv),

        Err(er) => match er {
            Ok(refund_info) => {
                let code = refund_info.error_code;
                spawn(perform_refund(refund_info));

                Err(code)
            }
            Err(error_code) => Err(error_code),
        },
    }
}
