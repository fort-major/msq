use std::{
    cell::RefCell,
    collections::{btree_map::Values, BTreeMap},
};

use candid::{CandidType, Nat, Principal};
use ic_cdk::{query, update};
use serde::Deserialize;

use crate::utils::Ticker;

pub type TokenId = Principal;

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct Token {
    pub id: TokenId,
    pub ticker: Ticker,
    pub decimals: u8,
    pub fee: Nat,
}

#[derive(Default, CandidType, Deserialize, Clone)]
pub struct SupportedTokensState {
    tokens: BTreeMap<TokenId, Token>,
    tokens_by_ticker: BTreeMap<Ticker, TokenId>,
}

impl SupportedTokensState {
    pub fn add_token(&mut self, token: Token) {
        self.tokens_by_ticker.insert(token.ticker, token.id);
        self.tokens.insert(token.id, token);
    }

    pub fn remove_token(&mut self, ticker: Ticker) {
        if let Some(token_id) = self.tokens_by_ticker.remove(&ticker) {
            self.tokens.remove(&token_id);
        }
    }

    pub fn contains_id(&self, id: &TokenId) -> bool {
        self.tokens.contains_key(id)
    }

    pub fn contains_ticker(&self, ticker: &str) -> bool {
        self.tokens_by_ticker.contains_key(ticker)
    }

    pub fn get(&self) -> Values<TokenId, Token> {
        self.tokens.values()
    }

    pub fn get_by_id(&self, id: &TokenId) -> Option<&Token> {
        self.tokens.get(id)
    }

    pub fn ticker_by_token_id(&self, token_id: &TokenId) -> Option<Ticker> {
        self.tokens.get(token_id).map(|it| it.ticker)
    }
}

// ---------------------------- STATE ------------------------

thread_local! {
    pub static SUPPORTED_TOKENS: RefCell<SupportedTokensState> = RefCell::default();
}

pub fn init_supported_tokens(tokens: Vec<Token>) {
    SUPPORTED_TOKENS.with_borrow_mut(|s| {
        for t in tokens {
            s.add_token(t);
        }
    });
}

#[derive(CandidType, Deserialize)]
pub struct GetSupportedTokensResponse {
    pub supported_tokens: Vec<Token>,
}

#[query]
fn get_supported_tokens() -> GetSupportedTokensResponse {
    let supported_tokens = SUPPORTED_TOKENS.with_borrow(|s| s.get().cloned().collect::<Vec<_>>());

    GetSupportedTokensResponse { supported_tokens }
}

#[derive(CandidType, Deserialize)]
pub struct AddSupportedTokenRequest {
    pub token: Token,
}

#[update]
fn add_supported_token(req: AddSupportedTokenRequest) {
    SUPPORTED_TOKENS.with_borrow_mut(|it| it.add_token(req.token));
}

#[derive(CandidType, Deserialize)]
pub struct RemoveSupportedTokenRequest {
    ticker: Ticker,
}

#[update]
fn remove_supported_token(req: RemoveSupportedTokenRequest) {
    SUPPORTED_TOKENS.with_borrow_mut(|it| it.remove_token(req.ticker));
}
