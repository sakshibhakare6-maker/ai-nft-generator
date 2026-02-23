/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import { useState, useEffect } from 'react';
import { NFTStorage } from 'nft.storage'
import { ethers } from 'ethers';
import axios from 'axios';
import Spinner from 'react-bootstrap/Spinner';
import Navigation from './components/Navigation';
import NFT from './abis/NFT.json'
import contractConfig from './config.json';  // For contract addresses
import envConfig from './config.js';         // For environment config

function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [nft, setNFT] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  //const [url, setURL] = useState(null);
  //const [message, setMessage] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSignup, setIsSignup] = useState(true);
  const [authMessage, setAuthMessage] = useState("");
  const [profile, setProfile] = useState(null);
  const [savedImages, setSavedImages] = useState([]);

  // Get config based on environment - FIXED
  const currentEnv = process.env.NODE_ENV || 'development';
  const BACKEND_URL = envConfig[currentEnv]?.BACKEND_URL || 'http://localhost:5000';

  console.log('Current Environment:', currentEnv);
console.log('Backend URL:', BACKEND_URL);

// Add a test function
useEffect(() => {
  const testBackend = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/health`);
      const data = await res.json();
      console.log('Backend connection successful:', data);
    } catch (error) {
      console.error('Backend connection failed:', error);
    }
  };
  testBackend();
}, []);
  const loadBlockchainData = async () => {
    try {
      if (!window.ethereum) {
        console.error("Please install MetaMask");
        return;
      }
      const prov = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(prov);
      const network = await prov.getNetwork();
      console.log("Connected to network:", network.chainId);
      
      // Get contract address from config.json
      const chainId = network.chainId.toString();
      const contractAddress = contractConfig[chainId]?.nft?.address;
      
      if (!contractAddress) {
        console.error(`No contract address found for chain ID ${chainId}`);
        return;
      }
      
      const nftContract = new ethers.Contract(contractAddress, NFT, prov);
      setNFT(nftContract);
      console.log("NFT contract loaded:", contractAddress);
    } catch (err) { 
      console.error("Blockchain loading error:", err); 
    }
  };

  useEffect(() => { 
    loadBlockchainData(); 
  }, [BACKEND_URL]);

  // --------------- REGISTER ----------------
  const handleRegister = async () => {
    if (!/^[A-Za-z]+$/.test(name)) return alert("Name must contain only letters");
    if (password.length < 8 || !/[0-9]/.test(password) || password[0] !== password[0].toUpperCase()) {
      return alert("Password must start uppercase, include number, min 8 chars");
    }
    try {
      console.log("Registering at:", `${BACKEND_URL}/register`);
      const res = await axios.post(`${BACKEND_URL}/register`, { name, email, password });
      if (res.data.error) {
        alert(res.data.error);
      } else { 
        alert("Registered successfully! Please login."); 
        setIsSignup(false); 
        setAuthMessage(""); 
      }
    } catch(err) { 
      alert("Server error. Make sure backend is running at " + BACKEND_URL); 
      console.error("Register error:", err); 
    }
  };

  // --------------- LOGIN ----------------
  const handleLogin = async () => {
    try {
      console.log("Logging in at:", `${BACKEND_URL}/login`);
      const res = await axios.post(`${BACKEND_URL}/login`, { email, password });
      if (res.data.error) {
        setAuthMessage(res.data.error);
      } else {
        setProfile({ name: res.data.name, email: res.data.email });
        setIsLoggedIn(true);
        fetchSavedImages(res.data.email);
        setAuthMessage("");
      }
    } catch(err) { 
      alert("Server error. Make sure backend is running at " + BACKEND_URL); 
      console.error("Login error:", err); 
    }
  };

  // --------------- FETCH IMAGES ----------------
  const fetchSavedImages = async (userEmail) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/images/${userEmail}`);
      setSavedImages(res.data);
    } catch(err){ console.error("Fetch images error:", err); }
  };

  // --------------- NFT GENERATOR ----------------
  const submitHandler = async (e) => {
    e.preventDefault();
    if (!description) return alert("Enter a description");
    try {
      setIsWaiting(true);
      setMessage("Generating image...");
      const imageData = await axios.post(`${BACKEND_URL}/generate`, { prompt: description });
      setImage(imageData.data.image);

      setMessage("Uploading to IPFS...");
      const nftstorage = new NFTStorage({ token: process.env.REACT_APP_NFT_STORAGE_API_KEY });
      const metadata = await nftstorage.store({ 
        name: description, 
        description, 
        image: imageData.data.image 
      });
      const url = metadata.url;
      setURL(url);

      setMessage("Minting NFT...");
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const signer = provider.getSigner();
      const connectedNFT = nft.connect(signer);
      const tx = await connectedNFT.mint(url, { value: ethers.utils.parseEther("0.01") });
      await tx.wait();
      setMessage("NFT Minted 🎉");

      await axios.post(`${BACKEND_URL}/save_image`, { 
        email: profile.email, 
        image_path: imageData.data.image 
      });
      fetchSavedImages(profile.email);
    } catch(err) { 
      console.error("NFT generation error:", err); 
      alert("NFT generation failed: " + err.message); 
    } finally { 
      setIsWaiting(false); 
      setMessage(""); 
    }
  };

  // --------------- LOGIN/SIGNUP FORM ----------------
  if (!isLoggedIn) {
    return (
      <div style={{display:"flex", justifyContent:"center", alignItems:"center", height:"100vh", background:"#e6f0ff"}}>
        <div style={{background:"#fff", padding:"40px", borderRadius:"10px", boxShadow:"0px 0px 15px rgba(0,0,0,0.2)", width:"360px"}}>
          {isSignup ? (
            <>
              <h2 style={{textAlign:"center"}}>Signup</h2>
              <input style={inputStyle} placeholder="Name" value={name} onChange={e=>setName(e.target.value)}/>
              <input style={inputStyle} type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
              <input style={inputStyle} type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>
              <button style={buttonStyle} onClick={handleRegister}>Register</button>
              <p style={{textAlign:"center"}}>Already have account? <span style={{color:"#007bff", cursor:"pointer"}} onClick={()=>{setIsSignup(false); setAuthMessage("")}}>Login</span></p>
            </>
          ) : (
            <>
              <h2 style={{textAlign:"center"}}>Login</h2>
              <input style={inputStyle} type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
              <input style={inputStyle} type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>
              <button style={buttonStyle} onClick={handleLogin}>Login</button>
              {authMessage && <p style={{color:"red", textAlign:"center"}}>{authMessage}</p>}
              <p style={{textAlign:"center"}}>New user? <span style={{color:"#007bff", cursor:"pointer"}} onClick={()=>{setIsSignup(true); setAuthMessage("")}}>Signup</span></p>
            </>
          )}
        </div>
      </div>
    );
  }

  // --------------- DASHBOARD ----------------
  return (
    <div style={{padding:"20px"}}>
      <Navigation account={account} setAccount={setAccount}/>
      <h2>Welcome, {profile.name}</h2>
      <form onSubmit={submitHandler}>
        <input type="text" placeholder="Describe your NFT..." value={description} onChange={e=>setDescription(e.target.value)}/>
        <input type="submit" value="Generate & Mint" />
      </form>
      <div>
        {isWaiting ? <Spinner animation="border" /> : image ? <img src={image} alt="NFT artwork" style={{maxWidth:"300px"}}/> : null}
      </div>
      <h3>Saved Images</h3>
      <div style={{display:"flex", gap:"10px", flexWrap:"wrap"}}>
        {savedImages.map((img, idx)=><img key={idx} src={img.image_path} alt="saved" style={{width:"100px", borderRadius:"5px"}}/>)}
      </div>
    </div>
  );
}

const inputStyle = { width:"100%", padding:"10px", margin:"10px 0", borderRadius:"5px", border:"1px solid #ccc" };
const buttonStyle = { width:"100%", padding:"10px", margin:"10px 0", borderRadius:"5px", border:"none", background:"#007bff", color:"#fff", cursor:"pointer" };

export default App;
