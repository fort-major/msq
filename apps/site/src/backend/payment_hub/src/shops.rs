use std::{
    cell::RefCell,
    collections::{btree_map::Entry, BTreeMap, BTreeSet},
};

use candid::{CandidType, Nat, Principal};
use futures::join;
use ic_cdk::{caller, query, update};
use icrc_ledger_types::icrc1::{
    account::Account,
    transfer::{Memo, TransferArg},
};
use serde::Deserialize;

use crate::{
    tokens::SUPPORTED_TOKENS,
    utils::{calc_shop_subaccount, ICRC1CanisterClient, ShopId},
};

#[derive(CandidType, Deserialize, Clone)]
pub struct Shop {
    pub id: ShopId,
    pub owner: Principal,
    pub invoice_creators: BTreeSet<Principal>,
    pub name: String,
    pub description: String,
    pub icon_base64: String,
    pub referal: Option<Principal>,
}

#[derive(CandidType, Deserialize, Default)]
pub struct ShopsState {
    pub shop_id_generator: ShopId,
    pub shops: BTreeMap<ShopId, Shop>,
    pub owner_to_shops: BTreeMap<Principal, BTreeSet<ShopId>>,
    pub fee_collector_account: Option<Account>,
}

impl ShopsState {
    pub fn set_fee_collector_account(&mut self, new_fee_collector_account: Option<Account>) {
        self.fee_collector_account = new_fee_collector_account;
    }

    pub fn create_shop(
        &mut self,
        invoice_creators: BTreeSet<Principal>,
        name: String,
        description: String,
        icon_base64: String,
        referal: Option<Principal>,
        caller: Principal,
    ) -> ShopId {
        let id = self.generate_shop_id();
        let shop = Shop {
            id,
            owner: caller,
            invoice_creators,
            name,
            description,
            icon_base64,
            referal,
        };

        self.shops.insert(id, shop);
        match self.owner_to_shops.entry(caller) {
            Entry::Occupied(mut e) => {
                e.get_mut().insert(id);
            }
            Entry::Vacant(e) => {
                let mut s = BTreeSet::new();
                s.insert(id);

                e.insert(s);
            }
        };

        id
    }

    fn update_shop(
        &mut self,
        id: ShopId,
        new_owner_opt: Option<Principal>,
        new_invoice_creators_opt: Option<BTreeSet<Principal>>,
        new_name_opt: Option<String>,
        new_description_opt: Option<String>,
        new_icon_base64_opt: Option<String>,
        caller: Principal,
    ) -> Result<(), String> {
        let shop = self.shops.get_mut(&id).ok_or(format!("Shop not found"))?;

        if shop.owner != caller {
            return Err(format!("Access denied"));
        }

        if let Some(new_owner) = new_owner_opt {
            self.owner_to_shops
                .get_mut(&shop.owner)
                .as_mut()
                .ok_or(format!("Unreachable - no owner to shop relation found"))?
                .remove(&id);

            match self.owner_to_shops.entry(new_owner) {
                Entry::Occupied(mut e) => {
                    e.get_mut().insert(id);
                }
                Entry::Vacant(e) => {
                    let mut s = BTreeSet::new();
                    s.insert(id);

                    e.insert(s);
                }
            };

            shop.owner = new_owner;
        }

        if let Some(new_invoice_creators) = new_invoice_creators_opt {
            shop.invoice_creators = new_invoice_creators;
        }

        if let Some(new_name) = new_name_opt {
            shop.name = new_name;
        }

        if let Some(new_description) = new_description_opt {
            shop.description = new_description;
        }

        if let Some(new_icon_base64) = new_icon_base64_opt {
            shop.icon_base64 = new_icon_base64;
        }

        Ok(())
    }

    pub fn get_referal(&self, shop_id: &ShopId) -> Option<Principal> {
        let shop = self.shops.get(shop_id)?;

        shop.referal
    }

    pub fn get_shops_by_owner(&self, owner: &Principal) -> Vec<Shop> {
        if let Some(ids) = self.owner_to_shops.get(owner) {
            ids.iter()
                .map(|id| self.shops.get(id).cloned().unwrap())
                .collect()
        } else {
            Vec::new()
        }
    }

    fn generate_shop_id(&mut self) -> ShopId {
        let val = self.shop_id_generator;
        self.shop_id_generator += 1;

        return val;
    }
}

thread_local! {
    pub static SHOPS_STATE: RefCell<ShopsState> = RefCell::default();
}

#[derive(CandidType, Deserialize)]
pub struct RegisterShopRequest {
    pub invoice_creators: BTreeSet<Principal>,
    pub name: String,
    pub description: String,
    pub icon_base64: String,
    pub referal: Option<Principal>,
}

#[derive(CandidType, Deserialize)]
pub struct RegisterShopResponse {
    pub shop_id: ShopId,
}

#[update]
pub fn register_shop(req: RegisterShopRequest) -> RegisterShopResponse {
    // TODO: validate req

    let id = SHOPS_STATE.with_borrow_mut(|s| {
        s.create_shop(
            req.invoice_creators,
            req.name,
            req.description,
            req.icon_base64,
            req.referal,
            caller(),
        )
    });

    RegisterShopResponse { shop_id: id }
}

#[derive(CandidType, Deserialize)]
pub struct UpdateShopRequest {
    pub id: ShopId,
    pub new_owner_opt: Option<Principal>,
    pub new_invoice_creators_opt: Option<BTreeSet<Principal>>,
    pub new_name_opt: Option<String>,
    pub new_description_opt: Option<String>,
    pub new_icon_base64_opt: Option<String>,
}

#[update]
pub fn update_shop(req: UpdateShopRequest) {
    // TODO: validate req

    SHOPS_STATE
        .with_borrow_mut(|s| {
            s.update_shop(
                req.id,
                req.new_owner_opt,
                req.new_invoice_creators_opt,
                req.new_name_opt,
                req.new_description_opt,
                req.new_icon_base64_opt,
                caller(),
            )
        })
        .expect("Unable to update shop");
}

#[derive(CandidType, Deserialize)]
pub struct GetMyShopsResponse {
    pub shops: Vec<Shop>,
}

#[query]
pub fn get_my_shops() -> GetMyShopsResponse {
    let shops = SHOPS_STATE.with_borrow(|s| s.get_shops_by_owner(&caller()));

    GetMyShopsResponse { shops }
}

#[derive(CandidType, Deserialize)]
pub struct WithdrawProfitRequest {
    pub shop_id: ShopId,
    pub asset_id: Principal,
    pub to: Account,
    pub qty: Nat,
    pub memo: Option<Memo>,
}

#[derive(CandidType, Deserialize)]
pub struct WithdrawProfitResponse {
    pub block_idx: Nat,
}

#[update]
pub async fn withdraw_profit(req: WithdrawProfitRequest) -> WithdrawProfitResponse {
    // TODO: validate request

    let system_fee = SUPPORTED_TOKENS
        .with_borrow(|s| s.get_by_id(&req.asset_id).map(|it| it.fee.clone()))
        .expect("Unsupported token");

    if req.qty < system_fee.clone() * Nat::from(5u64) {
        panic!("Insufficient funds");
    }

    let (fee_collector_account_opt, referal_opt) = SHOPS_STATE.with_borrow(|s| {
        let fee_collector = s.fee_collector_account;
        let referal = s.get_referal(&req.shop_id);

        (fee_collector, referal)
    });

    // fmj gets 3% fee from the withdrawn amount, referal gets 20% fee from the fmj fee
    let (qty, fmj_fee, referal_fee) = match (fee_collector_account_opt, referal_opt) {
        (Some(_), Some(_)) => {
            let qty = req.qty.clone() * Nat::from(97u64) / Nat::from(100u64);
            let fmj_fee = (req.qty.clone() - qty.clone()) * Nat::from(80u64) / Nat::from(100u64);
            let referal_fee = req.qty - qty.clone() - fmj_fee.clone();

            (qty, fmj_fee, referal_fee)
        }
        (None, Some(_)) => {
            let qty = req.qty.clone() * Nat::from(97u64) / Nat::from(100u64);
            let fmj_fee = Nat::from(0u64);
            let referal_fee = req.qty - qty.clone() - fmj_fee.clone();

            (qty, fmj_fee, referal_fee)
        }
        (Some(_), None) => {
            let qty = req.qty.clone() * Nat::from(97u64) / Nat::from(100u64);
            let fmj_fee = req.qty - qty.clone();
            let referal_fee = Nat::from(0u64);

            (qty, fmj_fee, referal_fee)
        }
        (None, None) => {
            let qty = req.qty.clone();
            let fmj_fee = Nat::from(0u64);
            let referal_fee = Nat::from(0u64);

            (qty, fmj_fee, referal_fee)
        }
    };

    let token = ICRC1CanisterClient::new(req.asset_id);
    let shop_subaccount = calc_shop_subaccount(req.shop_id);

    let withdraw_transfer_future = async {
        let call_result = token
            .icrc1_transfer(TransferArg {
                from_subaccount: Some(shop_subaccount),
                to: req.to,
                fee: Some(system_fee.clone()),
                memo: req.memo,
                created_at_time: None,
                amount: qty.clone(),
            })
            .await;

        if let Err((code, msg)) = call_result {
            return Err(format!(
                "Unable to make an ICRC-1 transfer call to {}: [{:?}] {}",
                req.asset_id, code, msg
            ));
        }

        let (transfer_result,) = call_result.unwrap();

        if let Err(transfer_err) = transfer_result {
            return Err(format!(
                "Unable to make an ICRC-1 transfer to {}: {}",
                req.asset_id, transfer_err
            ));
        }

        let block_idx = transfer_result.unwrap();

        Ok(block_idx)
    };

    let fmj_fee_transfer_future = async {
        if let Some(fee_collector_account) = fee_collector_account_opt {
            token
                .icrc1_transfer(TransferArg {
                    from_subaccount: Some(shop_subaccount),
                    to: fee_collector_account,
                    fee: Some(system_fee.clone()),
                    memo: None,
                    created_at_time: None,
                    amount: fmj_fee,
                })
                .await;
        }

        // a stupid way of defining the type
        if false {
            return Err(String::new());
        } else {
            Ok(Nat::from(0u8))
        }
    };

    let referal_fee_transfer_future = async {
        if let Some(referal) = referal_opt {
            token
                .icrc1_transfer(TransferArg {
                    from_subaccount: Some(shop_subaccount),
                    to: Account {
                        owner: referal,
                        subaccount: None,
                    },
                    fee: Some(system_fee.clone()),
                    memo: None,
                    created_at_time: None,
                    amount: referal_fee,
                })
                .await;
        }

        if false {
            return Err(String::new());
        } else {
            Ok(Nat::from(0u8))
        }
    };

    // complete all transfers in once (this may lead to problems)
    let (withdraw_transfer_result, _, _) = join!(
        withdraw_transfer_future,
        fmj_fee_transfer_future,
        referal_fee_transfer_future
    );

    // only fail if the withdraw fails, ignore other failures
    match withdraw_transfer_result {
        Err(qty_transfer_error) => panic!("{}", qty_transfer_error),
        Ok(block_idx) => WithdrawProfitResponse { block_idx },
    }
}
