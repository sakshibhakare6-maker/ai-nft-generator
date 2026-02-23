// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  console.log("Deploying NFT contract...");

  const NFT = await hre.ethers.getContractFactory("NFT");
  const nft = await NFT.deploy();

  await nft.deployed();

  console.log(`NFT deployed to: ${nft.address}`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`Chain ID: ${hre.network.config.chainId}`);

  // Update config.json automatically
  const fs = require('fs');
  const configPath = './src/config.json';
  
  let config = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  
  if (!config[hre.network.config.chainId]) {
    config[hre.network.config.chainId] = {};
  }
  
  config[hre.network.config.chainId].nft = {
    address: nft.address
  };
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
  console.log(`✅ Updated config.json with contract address`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});