// server.js
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Define Schemas FIRST (before using them)
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  created_at: String
});

const imageSchema = new mongoose.Schema({
  email: String,
  image_path: String,
  created_at: String
});

// Create Models AFTER schemas are defined
const User = mongoose.model('User', userSchema);
const Image = mongoose.model('Image', imageSchema);

// Create indexes
User.createIndexes();
Image.createIndexes();

// ---------------- REGISTER ----------------
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log("📝 Registration attempt:", { name, email });
    
    if (!name || !email || !password) {
      return res.json({ error: "All fields are required" });
    }
    if (!/^[A-Za-z]+$/.test(name)) {
      return res.json({ error: "Name must contain only letters" });
    }
    if (password.length < 8 || !/[0-9]/.test(password) || password[0] !== password[0].toUpperCase()) {
      return res.json({ error: "Password must start uppercase, include number, min 8 chars" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.json({ error: "Email has already been registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const created_at = new Date().toISOString();
    
    const user = new User({ name, email, password: hashed, created_at });
    await user.save();
    
    console.log("✅ User registered successfully:", email);
    res.json({ message: "Registered successfully" });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.json({ error: "Server error. Registration failed" });
  }
});

// ---------------- LOGIN ----------------
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔐 Login attempt:", { email });
    
    if (!email || !password) {
      return res.json({ error: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ error: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.json({ error: "Wrong password" });
    }

    console.log("✅ Login successful:", email);
    res.json({ message: "Login success", name: user.name, email: user.email });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.json({ error: "Server error. Login failed" });
  }
});

// ---------------- SAVE IMAGE ----------------
app.post("/save_image", async (req, res) => {
  try {
    const { email, image_path } = req.body;
    console.log("💾 Saving image for:", email);
    
    const created_at = new Date().toISOString();
    
    const image = new Image({ email, image_path, created_at });
    await image.save();
    
    console.log("✅ Image saved for:", email);
    res.json({ message: "Image saved" });
  } catch (err) {
    console.error("❌ Save image error:", err);
    res.json({ error: "Server error. Failed to save image" });
  }
});

// ---------------- GET USER IMAGES ----------------
app.get("/images/:email", async (req, res) => {
  try {
    const email = req.params.email;
    console.log("📸 Fetching images for:", email);
    
    const images = await Image.find({ email }).sort({ created_at: -1 });
    console.log(`✅ Found ${images.length} images for:`, email);
    res.json(images);
  } catch (err) {
    console.error("❌ Fetch images error:", err);
    res.json([]);
  }
});

// ---------------- GENERATE AI IMAGE ----------------
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log("🎨 Generating image for prompt:", prompt);
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt missing" });
    }

    const imageURL = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
    console.log("✅ Image generated:", imageURL);
    res.json({ image: imageURL });
  } catch (err) {
    console.error("❌ Generate image error:", err);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});