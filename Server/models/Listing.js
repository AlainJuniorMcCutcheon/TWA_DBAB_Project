import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB using Mongoose
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB (Mongoose)');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Define the Listing schema
const listingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  price: Number,
  location: String,
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Create the model
const Listing = mongoose.model('Listing', listingSchema);

// Get all listings
export const getAllListings = async () => {
  try {
    return await Listing.find();
  } catch (err) {
    throw new Error('Error fetching listings: ' + err.message);
  }
};

// Create a new listing
export const createListing = async (listingData) => {
  try {
    const newListing = new Listing(listingData);
    await newListing.save();
    return newListing._id;
  } catch (err) {
    throw new Error('Error creating listing: ' + err.message);
  }
};

// Get a single listing by ID
export const getListingById = async (listingId) => {
  try {
    return await Listing.findById(listingId);
  } catch (err) {
    throw new Error('Error fetching listing by ID: ' + err.message);
  }
};

// Update a listing by ID
export const updateListing = async (listingId, updatedData) => {
  try {
    const result = await Listing.updateOne({ _id: listingId }, { $set: updatedData });
    return result.modifiedCount;
  } catch (err) {
    throw new Error('Error updating listing: ' + err.message);
  }
};

// Delete a listing by ID
export const deleteListing = async (listingId) => {
  try {
    const result = await Listing.deleteOne({ _id: listingId });
    return result.deletedCount;
  } catch (err) {
    throw new Error('Error deleting listing: ' + err.message);
  }
};
