use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct TradeData {
    pub timestamp: String,
    pub price: f64,
    pub volume: f64,
    pub symbol: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct RSIData {
    pub timestamp: String,
    pub symbol: String,
    pub rsi: f64,
    pub price: f64,
    pub period: usize,
}