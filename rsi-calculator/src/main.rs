use rdkafka::config::ClientConfig;
use rdkafka::consumer::{BaseConsumer, Consumer};
use rdkafka::producer::{BaseProducer, BaseRecord, Producer};
use rdkafka::Message;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Duration;
use anyhow::Result;
use serde_json::Value;

#[derive(Debug, Clone, Deserialize)]
struct TradeData {
    block_time: String,
    transaction_signature: String,
    #[serde(default)]
    block_num: Option<u64>,
    #[serde(default)]
    program_id: Option<String>,
    #[serde(default)]
    trade_type: Option<String>,
    wallet_address: String,
    token_address: String,
    is_buy: bool,
    amount_in_sol: f64,
    amount_in_token: f64,
    change_in_sol: f64,
    change_in_tokens: f64,
    price_in_sol: f64,
    virtual_sol_reserves: f64,
    virtual_token_reserves: f64,
    real_sol_reserves: f64,
    real_token_reserves: f64,
    #[serde(default)]
    fee_recipient: Option<String>,
    fee_basis_points: f64,
    fee_amount: f64,
    #[serde(default)]
    creator_address: Option<String>,
    creator_fee_basis_points: f64,
    creator_fee_amount: f64,
    #[serde(default)]
    ingested_at: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
struct RsiData {
    token_address: String,
    rsi: f64,
    price: f64,
    timestamp: String,
    period: u32,
}

struct RsiCalculator {
    period: usize,
    price_history: HashMap<String, Vec<f64>>,
}

impl RsiCalculator {
    fn new(period: usize) -> Self {
        Self {
            period,
            price_history: HashMap::new(),
        }
    }

    fn calculate_rsi(&mut self, token_address: &str, current_price: f64) -> Option<f64> {
        let history = self.price_history
            .entry(token_address.to_string())
            .or_insert_with(Vec::new);

        history.push(current_price);

        // Keep only the last `period * 2` prices for calculation
        if history.len() > self.period * 2 {
            history.drain(0..history.len() - self.period * 2);
        }

        // Need at least period + 1 points to calculate RSI
        if history.len() <= self.period {
            return None;
        }

        let gains_losses: Vec<f64> = history.windows(2)
            .map(|window| window[1] - window[0])
            .collect();

        // Take only the last `period` gains/losses
        let recent_changes = &gains_losses[gains_losses.len().saturating_sub(self.period)..];

        let (avg_gain, avg_loss) = self.calculate_average_gain_loss(recent_changes);

        if avg_loss == 0.0 {
            return Some(100.0);
        }

        let rs = avg_gain / avg_loss;
        let rsi = 100.0 - (100.0 / (1.0 + rs));

        Some(rsi)
    }

    fn calculate_average_gain_loss(&self, changes: &[f64]) -> (f64, f64) {
        let gains: Vec<f64> = changes.iter().map(|&x| if x > 0.0 { x } else { 0.0 }).collect();
        let losses: Vec<f64> = changes.iter().map(|&x| if x < 0.0 { -x } else { 0.0 }).collect();

        let avg_gain = gains.iter().sum::<f64>() / gains.len() as f64;
        let avg_loss = losses.iter().sum::<f64>() / losses.len() as f64;

        (avg_gain, avg_loss)
    }
}

// Flexible deserialization function
fn parse_trade_data(payload: &[u8]) -> Result<TradeData, serde_json::Error> {
    // First try to parse as Value to handle flexible types
    let value: Value = serde_json::from_slice(payload)?;
    
    // Then convert to TradeData with proper type handling
    let trade = TradeData {
        block_time: value["block_time"].as_str().unwrap_or("").to_string(),
        transaction_signature: value["transaction_signature"].as_str().unwrap_or("").to_string(),
        block_num: value["block_num"].as_u64().or_else(|| value["block_num"].as_str().and_then(|s| s.parse().ok())),
        program_id: value["program_id"].as_str().map(|s| s.to_string()),
        trade_type: value["trade_type"].as_str().map(|s| s.to_string()),
        wallet_address: value["wallet_address"].as_str().unwrap_or("").to_string(),
        token_address: value["token_address"].as_str().unwrap_or("").to_string(),
        is_buy: value["is_buy"].as_bool().unwrap_or(false),
        amount_in_sol: value["amount_in_sol"].as_f64().unwrap_or(0.0),
        amount_in_token: value["amount_in_token"].as_f64().unwrap_or(0.0),
        change_in_sol: value["change_in_sol"].as_f64().unwrap_or(0.0),
        change_in_tokens: value["change_in_tokens"].as_f64().unwrap_or(0.0),
        price_in_sol: value["price_in_sol"].as_f64().unwrap_or(0.0),
        virtual_sol_reserves: value["virtual_sol_reserves"].as_f64().unwrap_or(0.0),
        virtual_token_reserves: value["virtual_token_reserves"].as_f64().unwrap_or(0.0),
        real_sol_reserves: value["real_sol_reserves"].as_f64().unwrap_or(0.0),
        real_token_reserves: value["real_token_reserves"].as_f64().unwrap_or(0.0),
        fee_recipient: value["fee_recipient"].as_str().map(|s| s.to_string()),
        fee_basis_points: value["fee_basis_points"].as_f64().unwrap_or(0.0),
        fee_amount: value["fee_amount"].as_f64().unwrap_or(0.0),
        creator_address: value["creator_address"].as_str().map(|s| s.to_string()),
        creator_fee_basis_points: value["creator_fee_basis_points"].as_f64().unwrap_or(0.0),
        creator_fee_amount: value["creator_fee_amount"].as_f64().unwrap_or(0.0),
        ingested_at: value["ingested_at"].as_str().map(|s| s.to_string()),
    };
    
    Ok(trade)
}

#[tokio::main]
async fn main() -> Result<()> {
    println!("🚀 Starting RSI Calculator Microservice...");

    // Kafka configuration
    let consumer: BaseConsumer = ClientConfig::new()
        .set("bootstrap.servers", "localhost:9092")
        .set("group.id", "rsi-calculator-group-new") // NEW group to start from beginning
        .set("auto.offset.reset", "earliest") // Start from beginning
        .set("enable.partition.eof", "false")
        .create()?;

    let producer: BaseProducer = ClientConfig::new()
        .set("bootstrap.servers", "localhost:9092")
        .create()?;

    // Subscribe to trade-data topic
    consumer.subscribe(&["trade-data"])?;
    println!("✅ Subscribed to 'trade-data' topic");
    println!("📊 Consumer group: 'rsi-calculator-group-new'");
    println!("⏰ Starting from earliest offset");

    let mut rsi_calculator = RsiCalculator::new(14); // 14-period RSI
    let mut processed_count = 0;

    loop {
        match consumer.poll(Duration::from_millis(100)) {
            Some(Ok(message)) => {
                processed_count += 1;
                println!("\n--- Message #{} ---", processed_count);
                
                if let Some(payload) = message.payload() {
                    println!("📨 Payload length: {} bytes", payload.len());
                    
                    match parse_trade_data(payload) {
                        Ok(trade) => {
                            println!("✅ Parsed trade for token: {}... - Price: {} SOL", 
                                     &trade.token_address[..8], trade.price_in_sol);

                            // Calculate RSI
                            if let Some(rsi_value) = rsi_calculator.calculate_rsi(
                                &trade.token_address, 
                                trade.price_in_sol
                            ) {
                                // Create RSI data
                                let rsi_data = RsiData {
                                    token_address: trade.token_address.clone(),
                                    rsi: rsi_value,
                                    price: trade.price_in_sol,
                                    timestamp: trade.block_time.clone(),
                                    period: 14,
                                };

                                // Publish to rsi-data topic
                                if let Ok(json_data) = serde_json::to_string(&rsi_data) {
                                    let record = BaseRecord::to("rsi-data")
                                        .payload(&json_data)
                                        .key(&rsi_data.token_address);

                                    if let Err((kafka_error, _record)) = producer.send(record) {
                                        eprintln!("❌ Failed to send RSI data: {:?}", kafka_error);
                                    } else {
                                        println!("📤 Published RSI: {:.2} for token: {}",
                                                 rsi_value, &rsi_data.token_address[..8]);
                                    }
                                }

                                // Flush producer to ensure delivery
                                producer.flush(Duration::from_secs(1));
                            } else {
                                println!("⏳ Not enough data for RSI calculation yet (need 15+ price points)");
                            }
                        }
                        Err(e) => {
                            eprintln!("❌ Failed to parse trade data: {}", e);
                            // Debug: print the raw payload to see what's causing issues
                            if let Ok(raw) = std::str::from_utf8(payload) {
                                eprintln!("🔍 Raw payload snippet: {}", &raw[..200.min(raw.len())]);
                            }
                        }
                    }
                }
            }
            Some(Err(e)) => {
                eprintln!("❌ Kafka error: {}", e);
            }
            None => {
                // No message received, continue
                if processed_count == 0 {
                    println!("⏳ Waiting for messages... (run your data ingestion script if needed)");
                    tokio::time::sleep(Duration::from_secs(2)).await;
                }
            }
        }
    }
}