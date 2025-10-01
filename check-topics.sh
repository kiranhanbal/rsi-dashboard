#!/bin/bash
echo "Waiting for Redpanda to be ready..."
sleep 10

echo "Creating topics..."
docker-compose exec redpanda rpk topic create trade-data --brokers localhost:29092
docker-compose exec redpanda rpk topic create rsi-data --brokers localhost:29092

echo "Listing topics..."
docker-compose exec redpanda rpk topic list --brokers localhost:29092