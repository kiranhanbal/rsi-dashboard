use std::collections::HashMap;
use crate::models::TradeData;

pub struct RSICalculator {
    period: usize,
    symbol_data: HashMap<String, SymbolRSIData>,
}

struct SymbolRSIData {
    prices: Vec<f64>,
    gains: Vec<f64>,
    losses: Vec<f64>,
}

impl RSICalculator {
    pub fn new(period: usize) -> Self {
        RSICalculator {
            period,
            symbol_data: HashMap::new(),
        }
    }

    pub fn calculate_rsi(&mut self, trade: &TradeData) -> Option<f64> {
        let symbol = trade.symbol.clone();
        let price = trade.price;
        
        let data = self.symbol_data.entry(symbol).or_insert_with(|| SymbolRSIData {
            prices: Vec::with_capacity(self.period + 1),
            gains: Vec::with_capacity(self.period),
            losses: Vec::with_capacity(self.period),
        });

        data.prices.push(price);

        // Need at least 2 prices to calculate price change
        if data.prices.len() < 2 {
            return None;
        }

        let price_change = price - data.prices[data.prices.len() - 2];
        let gain = if price_change > 0.0 { price_change } else { 0.0 };
        let loss = if price_change < 0.0 { price_change.abs() } else { 0.0 };

        data.gains.push(gain);
        data.losses.push(loss);

        // Maintain window size for gains/losses
        if data.gains.len() > self.period {
            data.gains.remove(0);
            data.losses.remove(0);
        }

        // Calculate RSI once we have enough data
        if data.gains.len() == self.period {
            let avg_gain: f64 = data.gains.iter().sum::<f64>() / self.period as f64;
            let avg_loss: f64 = data.losses.iter().sum::<f64>() / self.period as f64;

            if avg_loss == 0.0 {
                return Some(100.0);
            }

            let rs = avg_gain / avg_loss;
            let rsi = 100.0 - (100.0 / (1.0 + rs));
            
            // Clamp RSI between 0 and 100
            Some(rsi.max(0.0).min(100.0))
        } else {
            None
        }
    }
}