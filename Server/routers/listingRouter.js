import express from 'express';
import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const listingRouter = express.Router();
const client = new MongoClient(process.env.MONGO_URI);

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Extract token from header

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);  // Verify token
    req.user = user; // Attach user to request for future use
    next(); // Proceed to next middleware or route handler
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

// Get all listings
listingRouter.get('/', authenticateToken, async (req, res) => {
  console.log('Authenticated user:', req.user); // Log the user to check

  try {
    const db = client.db(process.env.DB_NAME);
    const listings = await db.collection('Listings').find({}).toArray();
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching listings', error: err.message });
  }
});

// Create a new listing (only accessible by hosts)
listingRouter.post('/', authenticateToken, async (req, res) => {
  const { title, address, price } = req.body;

  // Check if the user is a host
  if (req.user.role !== 'host') {
    return res.status(403).json({ message: 'Only hosts can create listings' });
  }

  if (!title || !address || !price) {
    return res.status(400).json({ message: 'Title, address, and price are required' });
  }

  const newListing = {
    title,
    address,
    price,
    host: req.user.username, // Use 'host' instead of 'owner'
    createdAt: new Date(),
  };

  try {
    const db = client.db(process.env.DB_NAME);
    const result = await db.collection('Listings').insertOne(newListing);
    res.status(201).json({ message: 'Listing created', id: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: 'Error creating listing', error: err.message });
  }
});

export default listingRouter;
