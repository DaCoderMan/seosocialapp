#!/bin/bash

echo "======================================"
echo "  Workitu SEO & Social Media Manager"
echo "======================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please download and install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if MongoDB is running (optional check)
echo "Checking MongoDB connection..."
if ! command -v mongod &> /dev/null; then
    echo "Warning: MongoDB might not be running"
    echo "Please make sure MongoDB is installed and running"
    echo "Download from: https://www.mongodb.com/try/download/community"
    echo
fi

echo "Installing backend dependencies..."
cd backend
npm install

echo "Installing frontend dependencies..."
cd ../frontend
npm install

echo
echo "Setup complete! To start the application:"
echo
echo "1. Start MongoDB (if not already running)"
echo "2. Open two terminal windows:"
echo "   - Backend: cd backend && npm run dev"
echo "   - Frontend: cd frontend && npm run dev"
echo
echo "Default admin credentials:"
echo "Username: admin"
echo "Password: admin123"
echo
echo "Access the application at: http://localhost:3000"
echo

read -p "Press Enter to continue..."


