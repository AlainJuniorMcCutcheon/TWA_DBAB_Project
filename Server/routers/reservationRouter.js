import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { authenticateToken } from '../middleware/authMiddleware.js';

dotenv.config();

const reservationRouter = express.Router();
 // const uri = process.env.MONGO_URI;
const uri = 'mongodb+srv://MrBinks:WzyKgQl7J44WKjR1@freeworld.5dellif.mongodb.net/AirBnB?retryWrites=true&w=majority&appName=FreeWorld';
const client = new MongoClient(uri);
let reservationCollection;

//const MONGO_URI = 'mongodb+srv://MrBinks:WzyKgQl7J44WKjR1@freeworld.5dellif.mongodb.net/AirBnB?retryWrites=true&w=majority&appName=FreeWorld';
const DB_NAME = 'AirBnB';

client.connect()
  .then(() => {
    // const db = client.db(process.env.DB_NAME);
    const db = client.db(DB_NAME);
    reservationCollection = db.collection("Reservations"); // Corrected collection name
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

reservationRouter.get('/hosts', authenticateToken, async (req, res) => {
  try {
    const db = client.db(DB_NAME);
    const hostId = req.user.hostId; // Get hostId from JWT token
    
    // First, get all reservations directly by hostId
    const directReservations = await db.collection('Reservations')
      .find({ hostId: hostId })
      .toArray();

    // Then get reservations via listings (original approach)
    const listings = await db.collection('Listings')
      .find({ 
        $or: [
          { hostId: hostId },
          { 'host.host_id': hostId }
        ]
      })
      .toArray();

    const listingIds = listings.map(l => l._id.toString());
    const reservationsByListings = await db.collection('Reservations')
      .find({ listingId: { $in: listingIds } })
      .toArray();

    // Combine both results and remove duplicates
    const allReservations = [...directReservations, ...reservationsByListings];
    const uniqueReservations = allReservations.filter(
      (res, index, self) => index === self.findIndex(t => t._id.toString() === res._id.toString())
    );

    res.json({
      reservations: uniqueReservations,
      listings: listings.map(l => ({
        _id: l._id.toString(),
        title: l.title
      }))
    });
    
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ 
      message: 'Error fetching host reservations',
      error: err.message 
    });
  }
});


// Add this endpoint for status updates
reservationRouter.patch('/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await reservationCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.json({ message: 'Reservation status updated' });
  } catch (err) {
    res.status(500).json({ 
      message: 'Error updating reservation status', 
      error: err.message 
    });
  }
});

export default reservationRouter;
