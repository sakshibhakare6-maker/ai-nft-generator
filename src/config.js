// src/config.js
const config = {
  development: {
    BACKEND_URL: 'http://localhost:5000',
    NETWORK_ID: '31337',
    EXPLORER_URL: 'http://localhost:8545'
  },
  production: {
    BACKEND_URL: process.env.REACT_APP_BACKEND_URL || 'https://your-backend.onrender.com',
    NETWORK_ID: '11155111',
    EXPLORER_URL: 'https://sepolia.etherscan.io'
  }
};

export default config;