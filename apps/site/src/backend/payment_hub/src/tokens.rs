use std::{
    borrow::Borrow,
    cell::RefCell,
    collections::{btree_map::Values, BTreeMap, BTreeSet},
    str::FromStr,
};

use candid::{CandidType, Nat, Principal};
use ic_cdk::{query, update};
use serde::Deserialize;
use tinystr::{TinyStr16, TinyStrAuto};

pub type TokenId = Principal;
#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Clone, Copy)]
pub struct Ticker(pub TinyStr16);

impl Borrow<str> for Ticker {
    fn borrow(&self) -> &str {
        self.0.borrow()
    }
}

impl<T> From<T> for Ticker
where
    T: AsRef<str>,
{
    fn from(value: T) -> Self {
        Self(TinyStr16::from_str(value.as_ref()).unwrap())
    }
}

impl CandidType for Ticker {
    fn _ty() -> candid::types::Type {
        String::_ty()
    }

    fn idl_serialize<S>(&self, serializer: S) -> Result<(), S::Error>
    where
        S: candid::types::Serializer,
    {
        self.0.idl_serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for Ticker {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        Ok(Ticker(
            TinyStr16::from_str(String::deserialize(deserializer)?.as_str()).unwrap(),
        ))
    }
}

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
}

thread_local! {
    pub static SUPPORTED_TOKENS: RefCell<SupportedTokensState> = RefCell::default();
}

pub fn init_supported_tokens(tokens: Vec<Token>) {
    SUPPORTED_TOKENS.with(|it| {
        let mut s = it.borrow_mut();

        for t in tokens {
            s.add_token(t);
        }
    });
}

#[query]
fn get_supported_tokens() -> Vec<Token> {
    SUPPORTED_TOKENS.with(|it| it.borrow().get().cloned().collect::<Vec<_>>())
}

#[update]
fn add_supported_token(token: Token) {
    SUPPORTED_TOKENS.with(|it| it.borrow_mut().add_token(token));
}

#[update]
fn remove_supported_token(ticker: Ticker) {
    SUPPORTED_TOKENS.with(|it| it.borrow_mut().remove_token(ticker));
}
