use std::collections::{BTreeMap, BTreeSet};

use candid::{Nat, Principal};
use ic_cdk::{api::time, caller};

pub type InvoiceId = [u8; 32];
pub type RawCertificateChain = Vec<Vec<u8>>;

pub const DEFAULT_TTL: u8 = 2;
pub const RECYCLING_TTL: u8 = 0;

pub enum InvoiceStatus {
    Created { ttl: u8 },
    Paid,
    Notified,
}

pub struct Invoice {
    pub state: InvoiceStatus,
    pub qty_usd: Nat,
    pub created_at: u64,
    pub creator: Principal,
}

#[derive(Default)]
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

    pub fn pay(&mut self, id: InvoiceId, cert_chain: RawCertificateChain) {
        // TODO: assert invoice exists, verify cert chain, parse index block, cmp qtys with exchange rate
        // TODO: update invoice status, if all good, return Ok
        // TODO: if something is not good, return Refund
    }

    fn generate_id(&mut self, salt: &[u8]) -> InvoiceId {
        let mut hasher = blake3::Hasher::new();
        hasher.update(&self.invoice_id_generator);
        hasher.update(salt);

        hasher.finalize().into()
    }
}
