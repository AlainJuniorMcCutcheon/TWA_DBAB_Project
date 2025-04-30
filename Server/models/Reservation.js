import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { authenticateToken } from './authMiddleware.js';

dotenv.config();

const reservationRouter = express.Router();
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const dbName = 'AirBnB';
let reservationCollection;

client.connect()
  .then(() => {
    const db = client.db(dbName);
    reservationCollection = db.collection("Reservation"); // Corrected collection name
    console.log('Connected to MongoDB: Reservations ready');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
  });

// Get reservations by listing ID
reservationRouter.get('/listing/:listingId', authenticateToken, async (req, res) => {
  const listingId = req.params.listingId;

  try {
    const reservations = await reservationCollection.find({ listingId: listingId }).toArray();
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reservations', error: err.message });
  }
});

// Create a new reservation
reservationRouter.post('/', authenticateToken, async (req, res) => {
  const { listingId, guestName, checkIn, checkOut } = req.body;

  if (!listingId || !guestName || !checkIn || !checkOut) {
    return res.status(400).json({ message: 'Listing ID, guest name, check-in and check-out dates are required' });
  }

  const newReservation = {
    listingId,
    guestName,
    checkIn,
    checkOut,
    createdAt: new Date(),
  };

  try {
    const result = await reservationCollection.insertOne(newReservation); // Insert new reservation into Reservation collection
    res.status(201).json({ message: 'Reservation created', id: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: 'Error creating reservation', error: err.message });
  }
});

// DELETE a reservation by ID
reservationRouter.delete('/:id', authenticateToken, async (req, res) => {
  const reservationId = req.params.id;

  try {
    const reservation = await reservationCollection.findOne({ _id: new ObjectId(reservationId) });
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    await reservationCollection.deleteOne({ _id: new ObjectId(reservationId) });
    res.json({ message: 'Reservation deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting reservation', error: err.message });
  }
});

export default reservationRouter;
