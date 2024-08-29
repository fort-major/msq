use std::{
    cell::RefCell,
    collections::{btree_map::Entry, BTreeMap, BTreeSet},
};

use candid::{CandidType, Nat, Principal};
use ic_cdk::{caller, query, update};
use icrc_ledger_types::icrc1::{
    account::Account,
    transfer::{Memo, TransferArg},
};
use serde::Deserialize;

use crate::utils::{calc_shop_subaccount, ICRC1CanisterClient, ShopId};

#[derive(CandidType, Deserialize, Clone)]
pub struct Shop {
    pub id: ShopId,
    pub owner: Principal,
    pub invoicing_canisters: BTreeSet<Principal>,
    pub name: String,
    pub description: String,
    pub icon_base64: String,
    pub referal: Option<Principal>,
    pub balances: BTreeMap<Principal, Nat>,
}

#[derive(CandidType, Deserialize, Default)]
pub struct ShopsState {
    pub shop_id_generator: ShopId,
    pub shops: BTreeMap<ShopId, Shop>,
    pub owner_to_shops: BTreeMap<Principal, BTreeSet<ShopId>>,
}

impl ShopsState {
    pub fn create_shop(
        &mut self,
        invoicing_canisters: BTreeSet<Principal>,
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
            invoicing_canisters,
            name,
            description,
            icon_base64,
            referal,
            balances: BTreeMap::new(),
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
        new_invoicing_canisters_opt: Option<BTreeSet<Principal>>,
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

        if let Some(new_invoicing_canisters) = new_invoicing_canisters_opt {
            shop.invoicing_canisters = new_invoicing_canisters;
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

    pub fn increase_balance(
        &mut self,
        shop_id: ShopId,
        asset_id: Principal,
        inc: Nat,
    ) -> Result<(), String> {
        let shop = self
            .shops
            .get_mut(&shop_id)
            .ok_or(format!("Shop not found"))?;

        match shop.balances.entry(asset_id) {
            Entry::Occupied(mut e) => {
                *e.get_mut() += inc;
            }
            Entry::Vacant(e) => {
                e.insert(inc);
            }
        };

        Ok(())
    }

    pub fn decrease_balance(
        &mut self,
        shop_id: ShopId,
        asset_id: &Principal,
        dec: Nat,
        owner: &Principal,
    ) -> Result<(), String> {
        let shop = self
            .shops
            .get_mut(&shop_id)
            .ok_or(format!("Shop not found"))?;

        if *owner != shop.owner {
            return Err(format!("Access denied"));
        }

        let balance = shop
            .balances
            .get_mut(asset_id)
            .ok_or(format!("Insufficient funds"))?;

        if balance.0 < dec.0 {
            return Err(format!("Insufficient"));
        }

        *balance -= dec;

        Ok(())
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
    pub invoicing_canisters: BTreeSet<Principal>,
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
            req.invoicing_canisters,
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
    pub new_invoicing_canisters_opt: Option<BTreeSet<Principal>>,
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
                req.new_invoicing_canisters_opt,
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
    pub qty: Nat,
    pub to: Account,
    pub memo: Option<Memo>,
}

#[derive(CandidType, Deserialize)]
pub struct WithdrawProfitResponse {
    pub block_idx: Nat,
}

#[update]
pub async fn withdraw_profit(req: WithdrawProfitRequest) -> WithdrawProfitResponse {
    // TODO: validate request

    SHOPS_STATE
        .with_borrow_mut(|s| {
            s.decrease_balance(req.shop_id, &req.asset_id, req.qty.clone(), &caller())
        })
        .expect("Unable to decrease balance");

    let token = ICRC1CanisterClient::new(req.asset_id);

    let call_result = token
        .icrc1_transfer(TransferArg {
            from_subaccount: Some(calc_shop_subaccount(req.shop_id)),
            to: req.to,
            fee: None,
            memo: req.memo,
            created_at_time: None,
            amount: req.qty.clone(),
        })
        .await;

    if let Err((code, msg)) = call_result {
        SHOPS_STATE
            .with_borrow_mut(|s| s.increase_balance(req.shop_id, req.asset_id, req.qty))
            .expect("Unreacheable");

        panic!(
            "Unable to make an ICRC-1 transfer call to {}: [{:?}] {}",
            req.asset_id, code, msg
        );
    }

    let (transfer_result,) = call_result.unwrap();

    if let Err(transfer_err) = transfer_result {
        SHOPS_STATE
            .with_borrow_mut(|s| s.increase_balance(req.shop_id, req.asset_id, req.qty))
            .expect("Unreacheable");

        panic!(
            "Unable to make an ICRC-1 transfer to {}: {}",
            req.asset_id, transfer_err
        );
    }

    let block_idx = transfer_result.unwrap();

    WithdrawProfitResponse { block_idx }
}
