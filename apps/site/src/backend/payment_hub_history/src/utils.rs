use core::str;

use borsh::{BorshDeserialize, BorshSerialize};
use borsh_derive::{BorshDeserialize, BorshSerialize};
use candid::{CandidType, Nat, Principal};
use num_bigint::BigUint;
use serde::Deserialize;

pub type Timestamp = u64;
pub type TokenId = BorshPrincipal;
pub type USD = BorshNat;
pub type ShopId = u64;
pub type InvoiceId = [u8; 32];
pub type RawShopCertificate = Vec<u8>;

#[derive(CandidType, Deserialize, Clone, Copy, Debug)]
pub struct BorshPrincipal(pub Principal);

impl BorshSerialize for BorshPrincipal {
    fn serialize<W: std::io::prelude::Write>(&self, writer: &mut W) -> std::io::Result<()> {
        let slice = self.0.as_slice();
        let mut size_arr = [0u8; 8];
        size_arr.copy_from_slice(&slice.len().to_le_bytes());

        writer.write_all(&size_arr)?;
        writer.write_all(slice)
    }
}

impl BorshDeserialize for BorshPrincipal {
    fn deserialize_reader<R: std::io::prelude::Read>(reader: &mut R) -> std::io::Result<Self> {
        let mut size_arr = [0u8; 8];

        reader.read_exact(&mut size_arr)?;
        let size = usize::from_le_bytes(size_arr);
        let mut buf = vec![0u8; size];

        reader.read_exact(&mut buf)?;

        Ok(BorshPrincipal(Principal::from_slice(&buf)))
    }
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct BorshNat(pub Nat);

impl BorshSerialize for BorshNat {
    fn serialize<W: std::io::prelude::Write>(&self, writer: &mut W) -> std::io::Result<()> {
        let mut buf = [0u8; 32];
        buf.copy_from_slice(&self.0 .0.to_bytes_le());

        writer.write_all(&buf)
    }
}

impl BorshDeserialize for BorshNat {
    fn deserialize_reader<R: std::io::prelude::Read>(reader: &mut R) -> std::io::Result<Self> {
        let mut buf = [0u8; 32];
        reader.read_exact(&mut buf)?;

        Ok(BorshNat(Nat(BigUint::from_bytes_le(&buf))))
    }
}

#[derive(CandidType, BorshSerialize, BorshDeserialize, Deserialize, Clone, Debug)]
pub struct PaidInvoice {
    pub id: InvoiceId,
    pub shop_id: ShopId,
    pub payer: BorshPrincipal,

    pub created_at: Timestamp,
    pub paid_at: Timestamp,

    pub exchange_rates_timestamp: Timestamp,
    pub exchange_rate: USD,
    pub qty_usd: USD,

    pub token_id: TokenId,
    pub qty: BorshNat,
}

#[derive(BorshSerialize, BorshDeserialize)]
pub struct State {
    pub offset: u64,
    pub parent: BorshPrincipal,
    pub next: Option<BorshPrincipal>,

    pub log: Vec<PaidInvoice>,
}

impl State {
    pub fn init(offset: u64, parent: BorshPrincipal) -> Self {
        Self {
            offset,
            parent,
            next: None,
            log: Vec::new(),
        }
    }
}

pub fn unwrap_shop_certificate(shop_cert: &RawShopCertificate) -> ShopId {
    0
}
