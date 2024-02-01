use candid::{Nat, Principal};
use ic_cdk::{api::time, trap};

pub enum ICRC1InvoiceStatus {
    Created,
    Fulfilled,
    Delivered,
}

pub type ICRC1InvoiceId = [u8; 32];

pub struct ICRC1Invoice {
    id: ICRC1InvoiceId,
    status: ICRC1InvoiceStatus,

    creator: Principal,
    created_at: u64,

    token_canister_id: Principal,
    amount: Nat,

    recepient_name: Option<String>,
    invoice_description: Option<String>,

    block_id: Option<Nat>,
}

impl ICRC1Invoice {
    pub fn new(
        id: ICRC1InvoiceId,
        creator: Principal,
        token_canister_id: Principal,
        amount: Nat,
        recepient_name: Option<String>,
        invoice_description: Option<String>,
    ) -> Self {
        if let Some(n) = &recepient_name {
            if n.len() > 128 {
                trap("Recepient name too big");
            }
        }

        if let Some(d) = &invoice_description {
            if d.len() > 640 {
                trap("Invoice description too big");
            }
        }

        Self {
            id,
            status: ICRC1InvoiceStatus::Created,
            creator,
            created_at: time(),
            token_canister_id,
            amount,
            recepient_name,
            invoice_description,
            block_id: None,
        }
    }

    pub fn pay(&mut self, amount: Nat, block_id: Nat) -> Nat {
        if !self.is_created() {
            return amount;
        }

        if self.amount > amount {
            return amount;
        }

        self.status = ICRC1InvoiceStatus::Fulfilled;
        self.block_id = Some(block_id);

        amount - self.amount.clone()
    }

    #[inline(always)]
    pub fn deliver(&mut self) {
        if !self.is_fulfilled() {
            trap("The invoice is either not fulfilled yet or already delivered");
        }

        self.status = ICRC1InvoiceStatus::Delivered;
    }

    #[inline(always)]
    pub fn is_creator(&self, caller: &Principal) -> bool {
        self.creator == *caller
    }

    #[inline(always)]
    pub fn is_fulfilled(&self) -> bool {
        matches!(self.status, ICRC1InvoiceStatus::Fulfilled)
    }

    #[inline(always)]
    pub fn is_created(&self) -> bool {
        matches!(self.status, ICRC1InvoiceStatus::Created)
    }

    #[inline(always)]
    pub fn is_delivered(&self) -> bool {
        matches!(self.status, ICRC1InvoiceStatus::Delivered)
    }
}
