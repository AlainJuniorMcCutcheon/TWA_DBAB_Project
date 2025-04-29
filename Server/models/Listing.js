import express from 'express';
import { authenticateToken } from './authMiddleware.js'; 
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const listingRouter = express.Router();
const uri = process.env.MONGODB_URI; 
const client = new MongoClient(uri);
const dbName = 'AirBnB';
const collectionName = 'Listings';

let collection;

client.connect().then(() => {
  const db = client.db(dbName);
  collection = db.collection(collectionName);
  console.log('Connected to MongoDB: Listings ready');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err.message);
});

listingRouter.get('/', authenticateToken, async (req, res) => {
  try {
    const listings = await collection.find({}).toArray();
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching listings', error: err.message });
  }
});

listingRouter.post('/', authenticateToken, async (req, res) => {
  const { title, location, price } = req.body;

  if (!title || !location || !price) {
    return res.status(400).json({ message: 'Title, location, and price are required' });
  }

  const newListing = {
    title,
    location,
    price,
    owner: req.user.username, 
    createdAt: new Date(),
  };

  try {
    const result = await collection.insertOne(newListing); // Insert new listing
    res.status(201).json({ message: 'Listing created', id: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: 'Error creating listing', error: err.message });
  }
});

// DELETE a listing by ID - Auth required and owner check
listingRouter.delete('/:id', authenticateToken, async (req, res) => {
  const listingId = req.params.id;

  try {
    const listing = await collection.findOne({ _id: new ObjectId(listingId) }); // Find the listing by ID
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    // Check if the authenticated user is the owner of the listing
    if (listing.owner !== req.user.username) {
      return res.status(403).json({ message: 'You can only delete your own listings' });
    }

    await collection.deleteOne({ _id: new ObjectId(listingId) }); // Delete the listing
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting listing', error: err.message });
  }
});

export default listingRouter;
