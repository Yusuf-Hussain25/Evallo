#!/bin/bash

# Evallo Log System Startup Script
echo "🚀 Starting Evallo Log Ingestion and Querying System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm found"

# Install dependencies if not already installed
echo "📦 Installing dependencies..."
npm run install-all

# Start the development environment
echo "🔥 Starting development servers..."
echo "   Backend will run on: http://localhost:5000"
echo "   Frontend will run on: http://localhost:3000"
echo "   Press Ctrl+C to stop both servers"
echo ""

npm run dev 