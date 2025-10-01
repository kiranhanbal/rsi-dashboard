#!/usr/bin/env python3
import pandas as pd
import json
import time
from kafka import KafkaProducer
from kafka.errors import KafkaError
import sys
import os

class CSVToRedpanda:
    def __init__(self, bootstrap_servers='localhost:9092'):
        self.producer = KafkaProducer(
            bootstrap_servers=bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda v: v.encode('utf-8') if v else None,
            retries=3,
            acks='all'
        )
        self.topic = 'trade-data'
    
    def load_and_validate_csv(self, file_path):
        """Load CSV and validate required columns"""
        try:
            df = pd.read_csv(file_path)
            
            # Updated required columns based on your CSV structure
            required_columns = ['block_time', 'transaction_signature', 'token_address', 'is_buy', 'amount_in_sol']
            
            if not all(col in df.columns for col in required_columns):
                raise ValueError(f"CSV missing required columns. Found: {df.columns.tolist()}")
            
            # Convert and clean data types
            df['block_time'] = df['block_time'].astype(str)
            df['amount_in_sol'] = pd.to_numeric(df['amount_in_sol'], errors='coerce')
            df['is_buy'] = df['is_buy'].astype(bool)
            
            # Drop rows with invalid numeric data
            df = df.dropna(subset=['amount_in_sol'])
            
            print(f"Loaded {len(df)} valid records from CSV")
            return df
        except Exception as e:
            print(f"Error loading CSV: {e}")
            return None
    
    def stream_data(self, file_path, delay_ms=100):
        """Stream CSV data to Redpanda with simulated real-time delay"""
        df = self.load_and_validate_csv(file_path)
        if df is None:
            return False
        
        print(f"Streaming {len(df)} records to Redpanda topic '{self.topic}'")
        
        for index, row in df.iterrows():
            try:
                # Create message with all available columns from your CSV
                message = {
                    'block_time': row['block_time'],
                    'transaction_signature': row['transaction_signature'],
                    'block_num': row.get('block_num', ''),
                    'program_id': row.get('program_id', ''),
                    'trade_type': row.get('trade_type', ''),
                    'wallet_address': row.get('wallet_address', ''),
                    'token_address': row['token_address'],
                    'is_buy': bool(row['is_buy']),
                    'amount_in_sol': float(row['amount_in_sol']),
                    'amount_in_token': float(row.get('amount_in_token', 0)),
                    'change_in_sol': float(row.get('change_in_sol', 0)),
                    'change_in_tokens': float(row.get('change_in_tokens', 0)),
                    'price_in_sol': float(row.get('price_in_sol', 0)),
                    'virtual_sol_reserves': float(row.get('virtual_sol_reserves', 0)),
                    'virtual_token_reserves': float(row.get('virtual_token_reserves', 0)),
                    'real_sol_reserves': float(row.get('real_sol_reserves', 0)),
                    'real_token_reserves': float(row.get('real_token_reserves', 0)),
                    'fee_recipient': row.get('fee_recipient', ''),
                    'fee_basis_points': float(row.get('fee_basis_points', 0)),
                    'fee_amount': float(row.get('fee_amount', 0)),
                    'creator_address': row.get('creator_address', ''),
                    'creator_fee_basis_points': float(row.get('creator_fee_basis_points', 0)),
                    'creator_fee_amount': float(row.get('creator_fee_amount', 0)),
                    'ingested_at': row.get('ingested_at', '')
                }
                
                # Use token_address as key for partitioning (same tokens go to same partition)
                future = self.producer.send(
                    self.topic, 
                    value=message, 
                    key=row['token_address']
                )
                
                # Wait for message to be delivered
                record_metadata = future.get(timeout=10)
                
                trade_type = "BUY" if row['is_buy'] else "SELL"
                print(f"Sent: {row['token_address'][:8]}... - {trade_type} {row['amount_in_sol']} SOL - "
                      f"partition: {record_metadata.partition}, "
                      f"offset: {record_metadata.offset}")
                
                # Simulate real-time streaming
                time.sleep(delay_ms / 1000.0)
                
            except KafkaError as e:
                print(f"Kafka error: {e}")
                return False
            except Exception as e:
                print(f"Error sending message: {e}")
                continue
        
        self.producer.flush()
        print("Data streaming completed successfully!")
        return True

def main():
    if len(sys.argv) != 2:
        print("Usage: python ingest.py <csv_file_path>")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    
    if not os.path.exists(csv_file):
        print(f"Error: File {csv_file} not found")
        sys.exit(1)
    
    ingester = CSVToRedpanda()
    success = ingester.stream_data(csv_file)
    
    if success:
        print("Data ingestion completed successfully!")
    else:
        print("Data ingestion failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()