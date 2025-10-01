RSI Dashboard
A real-time cryptocurrency monitoring system that calculates and displays Relative Strength Index (RSI) for major cryptocurrencies using Redpanda, Rust, and Next.js.
---------------------------------------------------

Features
Real-time Data Streaming: Live cryptocurrency price data processing

RSI Calculation: 14-period Relative Strength Index calculation

Interactive Dashboard: Professional UI with price and RSI charts

Multi-token Support: BTC, ETH, SOL, DOGE, AVAX

Overbought/Oversold Indicators: Clear RSI level visualization

----------------------------------------------

Tech Stack
Backend: Rust (RSI calculation microservice)

Data Streaming: Redpanda (Kafka-compatible)

Frontend: Next.js 14 + TypeScript + Tailwind CSS

Charts: Recharts

Infrastructure: Docker + Docker Compose
----------------------------------------

Prerequisites
Docker & Docker Compose

Python 3.8+

Node.js 18+

Rust (optional, for development)

-------------------------------------

Quick Start

1. Clone and Setup

git clone <repo-url>
cd yebelo-project

2. Phase 1: Infrastructure Setup

# Start Redpanda
docker-compose up -d

# Create topics (using actual structure)
docker-compose exec redpanda rpk topic create trade-data --brokers localhost:29092

docker-compose exec redpanda rpk topic create rsi-data --brokers localhost:29092

# Verify
docker-compose exec redpanda rpk topic list --brokers localhost:29092

3. Phase 2: Data Ingestion
cd data-ingestion

# Install dependencies
pip install kafka-python pandas

# Stream sample data
python ingest.py /home/kiran-v-d/yebelo-project/data-ingestion/trades_data.csv

4. Phase 3: RSI Calculator

cd rsi-calculator

# Build and run RSI calculator
cargo run

5. Phase 4: Frontend Dashboard

cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

------------------------------------------
Access Applications
Dashboard: http://localhost:3000

Redpanda Console: http://localhost:8080

-------------------------------------------
Sample Data
The project includes sample data for 5 cryptocurrencies:

Bitcoin (BTC)

Ethereum (ETH)

Solana (SOL)

Dogecoin (DOGE)

Avalanche (AVAX)

----------------------------------------------
Development
Adding New Cryptocurrencies
Add data to data/trades_data.csv

Update symbol list in frontend/app/page.tsx

---------------------------------------------

Modifying RSI Period
Edit the period in rsi-processor/src/main.rs:

let mut rsi_calc = RSICalculator::new(14); // Change 14 to desired period

------------------------------------------------------------------

Customizing Dashboard

Modify components in frontend/components/ for UI changes.

-----------------------------------------------------------------

Troubleshooting

Port Already in Use

# Stop existing containers
docker-compose down

# Start fresh
docker-compose up -d

----------------------------------
RSI Interpretation
Overbought: RSI > 70 (Consider selling)

Oversold: RSI < 30 (Consider buying)

Neutral: RSI between 30-70

-----------------------------------------
