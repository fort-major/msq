use std::{
    cell::RefCell,
    collections::{BTreeMap, BTreeSet},
};

use candid::{CandidType, Nat, Principal};
use ic_cdk::{api::time, caller, query, update};
use serde::Deserialize;

use crate::{
    exchange_rates::EXCHANGE_RATES,
    tokens::TokenId,
    utils::{unwrap_cert_chain, verify_raw_cert_chain, Account, TransferTxn, USD},
};

pub type InvoiceId = [u8; 32];
pub type RawCertificateChain = Vec<Vec<u8>>;

pub const DEFAULT_TTL: u8 = 1;
pub const RECYCLING_TTL: u8 = 0;
pub const ARCHIVE_BATCH_SIZE: usize = 1000;

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum InvoiceStatus {
    Created { ttl: u8 },
    Paid,
    Notified,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Invoice {
    pub state: InvoiceStatus,
    pub qty_usd: Nat,
    pub created_at: u64,
    pub creator: Principal,
}

pub enum PayResult {
    Ok,
    Overpaid {
        token_id: TokenId,
        to: Account,
        qty: Nat,
    },
    Refund {
        token_id: TokenId,
        to: Account,
        qty: Nat,
    },
    BadTxn,
}

#[derive(Default, CandidType, Deserialize, Clone, Debug)]
pub struct InvoicesState {
    pub invoice_id_generator: InvoiceId,

    pub invoices: BTreeMap<InvoiceId, Invoice>,

    pub active_invoices: BTreeSet<InvoiceId>,
    pub paid_invoices: BTreeSet<InvoiceId>,
    pub notified_invoices: BTreeSet<InvoiceId>,
}

impl InvoicesState {
    pub fn init_id_seed(&mut self, seed: InvoiceId) {
        self.invoice_id_generator = seed;
    }

    pub fn create(&mut self, qty_usd: Nat) -> InvoiceId {
        let inv = Invoice {
            state: InvoiceStatus::Created { ttl: DEFAULT_TTL },
            qty_usd,
            created_at: time(),
            creator: caller(),
        };

        let id = self.generate_id(&inv.created_at.to_le_bytes());

        self.invoices.insert(id, inv);
        self.active_invoices.insert(id);

        id
    }

    pub fn purge_expired(&mut self) {
        let mut purged_invoices = Vec::new();

        for id in self.active_invoices.iter() {
            let mut remove = false;

            {
                let invoice = self.invoices.get_mut(id).unwrap();

                if let InvoiceStatus::Created { ttl } = invoice.state {
                    if ttl > 0 {
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
                purged_invoices.push(*id);
            }
        }

        for id in purged_invoices {
            self.active_invoices.remove(&id);
        }
    }

    pub fn move_archive_batch(&mut self) -> Vec<Invoice> {
        let mut result = Vec::new();

        let ids_to_remove = self
            .notified_invoices
            .iter()
            .take(ARCHIVE_BATCH_SIZE)
            .copied()
            .collect::<Vec<_>>();

        for id in ids_to_remove {
            self.notified_invoices.remove(&id);
            let invoice = self.invoices.remove(&id).unwrap();

            result.push(invoice);
        }

        result
    }

    pub fn pay(&mut self, id: &InvoiceId, cert_chain: RawCertificateChain) -> PayResult {
        if let Some(transfer_txn) = unwrap_cert_chain(&cert_chain) {
            if !verify_raw_cert_chain(cert_chain) {
                return Self::make_refund(transfer_txn);
            }

            if let Some(invoice) = self.invoices.get_mut(id) {
                if !matches!(invoice.state, InvoiceStatus::Created { ttl: _ }) {
                    return Self::make_refund(transfer_txn);
                }

                let comply_result = EXCHANGE_RATES
                    .with(|it| transfer_txn.complies_with_invoice(invoice, &it.borrow()));

                // if Ok or Overpaid - continue
                if !matches!(
                    comply_result,
                    PayResult::Ok
                        | PayResult::Overpaid {
                            token_id: _,
                            to: _,
                            qty: _
                        }
                ) {
                    return comply_result;
                }

                // everything is okay, update invoice status
                invoice.state = InvoiceStatus::Paid;
                self.active_invoices.remove(id);
                self.paid_invoices.insert(*id);

                return comply_result;
            } else {
                return Self::make_refund(transfer_txn);
            }
        } else {
            PayResult::BadTxn
        }
    }

    pub fn set_notified(&mut self, id: &InvoiceId) {
        let invoice = self.invoices.get_mut(id).unwrap();

        if !matches!(invoice.state, InvoiceStatus::Paid) {
            panic!("Invalid invoice state");
        }

        invoice.state = InvoiceStatus::Notified;
        self.paid_invoices.remove(id);
        self.notified_invoices.insert(*id);
    }

    fn make_refund(transfer_txn: TransferTxn) -> PayResult {
        return PayResult::Refund {
            token_id: transfer_txn.token_id,
            to: transfer_txn.from,
            qty: transfer_txn.qty,
        };
    }

    fn generate_id(&mut self, salt: &[u8]) -> InvoiceId {
        let mut hasher = blake3::Hasher::new();
        hasher.update(&self.invoice_id_generator);
        hasher.update(salt);

        hasher.finalize().into()
    }
}

thread_local! {
    pub static INVOICES_STATE: RefCell<InvoicesState> = RefCell::default();
}

pub fn purge_expired_invoices() {
    INVOICES_STATE.with(|it| it.borrow_mut().purge_expired());
}

pub fn eject_archive_invoice_batch() -> Vec<Invoice> {
    INVOICES_STATE.with(|it| it.borrow_mut().move_archive_batch())
}

#[query]
fn get_invoice(id: InvoiceId) -> Option<Invoice> {
    INVOICES_STATE.with(|it| it.borrow().invoices.get(&id).cloned())
}

#[update]
fn create_invoice(qty_usd: USD) -> InvoiceId {
    INVOICES_STATE.with(|it| it.borrow_mut().create(qty_usd))
}
