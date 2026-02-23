//import { useState } from "react";
import React from 'react';
const Navigation = ({ account, setAccount }) => {

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Install MetaMask");
      return;
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    setAccount(accounts[0]);
  };

  return (
    <nav>
      <h1>AI NFT Generator</h1>

      {account ? (
        <button className="connect">
          {account.slice(0, 6) + "..." + account.slice(38, 42)}
        </button>
      ) : (
        <button onClick={connectWallet} className="connect">
          Connect Wallet
        </button>
      )}
    </nav>
  );
};

export default Navigation;
