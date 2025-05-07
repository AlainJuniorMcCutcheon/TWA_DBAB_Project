import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const listingRouter = express.Router();

// Connect to MongoDB using Mongoose
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB with Mongoose: Listings ready'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Listing schema and model
const listingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  address: { type: String, required: true },
  price: { type: Number, required: true },
  host: { type: String, required: true }, // Ideally should be a ref to the User model
  createdAt: { type: Date, default: Date.now }
});

const Listing = mongoose.model('Listing', listingSchema);

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

// GET all listings
listingRouter.get('/', authenticateToken, async (req, res) => {
  console.log('Authenticated user:', req.user);

  try {
    const listings = await Listing.find();
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching listings', error: err.message });
  }
});

// POST create a new listing (only hosts)
listingRouter.post('/', authenticateToken, async (req, res) => {
  const { title, address, price } = req.body;

  if (req.user.role !== 'host') {
    return res.status(403).json({ message: 'Only hosts can create listings' });
  }

  if (!title || !address || !price) {
    return res.status(400).json({ message: 'Title, address, and price are required' });
  }

  const newListing = new Listing({
    title,
    address,
    price,
    host: req.user.username,
  });

  try {
    const savedListing = await newListing.save();
    res.status(201).json({ message: 'Listing created', id: savedListing._id });
  } catch (err) {
    res.status(500).json({ message: 'Error creating listing', error: err.message });
  }
});

export default listingRouter;
