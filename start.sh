#!/bin/bash

echo "🚀 Starting SagaReg Dashboard"
echo "=============================="

# Function to kill processes on exit
cleanup() {
    echo -e "\n🛑 Stopping all services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap for clean exit
trap cleanup INT TERM

# Start Backend
echo "📦 Starting Backend Server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start Frontend
echo "🎨 Starting Frontend Application..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "=================================="
echo "✅ SagaReg Dashboard is running!"
echo "=================================="
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend:  http://localhost:5000"
echo "📍 Health:   http://localhost:5000/health"
echo ""
echo "Press Ctrl+C to stop all services"
echo "=================================="

# Keep script running
wait
