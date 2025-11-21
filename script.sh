#!/bin/bash

# Check if an argument (argc) is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <mode>"
    echo "  0: Full Install (npm install + pip install) -> Build -> Run"
    echo "  1: Quick Start (Build -> Run)"
    exit 1
fi

MODE=$1

if [ "$MODE" -eq 0 ]; then
    echo "--- Mode 0: Full Setup & Run ---"
    
    # Frontend Setup
    echo "[1/4] Installing and Building Frontend..."
    cd frontend || { echo "Frontend directory not found"; exit 1; }
    npm install
    npm run build
    cd ..

    # Backend Setup
    echo "[2/4] Installing Backend Requirements..."
    # Note: Using relative path 'backend/' instead of root '/backend/'
    pip install -r backend/requirements.txt
    pip install waitress

    # Run
    echo "[3/4] Starting Waitress Server..."
    waitress-serve --listen=127.0.0.1:5000 backend.app:app

elif [ "$MODE" -eq 1 ]; then
    echo "--- Mode 1: Build & Run ---"

    # Frontend Build
    echo "[1/3] Building Frontend..."
    cd frontend || { echo "Frontend directory not found"; exit 1; }
    npm run build
    cd ..

    # Run
    echo "[2/3] Starting Waitress Server..."
    waitress-serve --listen=127.0.0.1:5000 backend.app:app

else
    echo "Error: Invalid argument. Please use 0 or 1."
    exit 1
fi