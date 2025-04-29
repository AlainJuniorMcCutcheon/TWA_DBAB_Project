import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// Set up the MongoDB client and database name
const client = new MongoClient(process.env.MONGO_URI);
const dbName = 'AirBnB'; // Your database name

// Utility function to get the Listings collection
const getListingsCollection = async () => {
  try {
    const db = await client.db(dbName);
    return db.collection('Listings');
  } catch (err) {
    throw new Error('Error accessing the database: ' + err.message);
  }
};

// Get all listings
export const getAllListings = async () => {
  try {
    const listingsCollection = await getListingsCollection();
    const listings = await listingsCollection.find({}).toArray();
    return listings;
  } catch (err) {
    throw new Error('Error fetching listings: ' + err.message);
  }
};

// Create a new listing
export const createListing = async (listingData) => {
  try {
    const listingsCollection = await getListingsCollection();
    const result = await listingsCollection.insertOne(listingData);
    return result.insertedId;
  } catch (err) {
    throw new Error('Error creating listing: ' + err.message);
  }
};

// Get a single listing by ID
export const getListingById = async (listingId) => {
  try {
    const listingsCollection = await getListingsCollection();
    const listing = await listingsCollection.findOne({ _id: new MongoClient.ObjectId(listingId) });
    return listing;
  } catch (err) {
    throw new Error('Error fetching listing by ID: ' + err.message);
  }
};

// Update a listing by ID
export const updateListing = async (listingId, updatedData) => {
  try {
    const listingsCollection = await getListingsCollection();
    const result = await listingsCollection.updateOne(
      { _id: new MongoClient.ObjectId(listingId) },
      { $set: updatedData }
    );
    return result.modifiedCount;
  } catch (err) {
    throw new Error('Error updating listing: ' + err.message);
  }
};

// Delete a listing by ID
export const deleteListing = async (listingId) => {
  try {
    const listingsCollection = await getListingsCollection();
    const result = await listingsCollection.deleteOne({ _id: new MongoClient.ObjectId(listingId) });
    return result.deletedCount;
  } catch (err) {
    throw new Error('Error deleting listing: ' + err.message);
  }
};
