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
reservationRouter.post('/', authenticateToken, async (req, res) => {
  const { 
    hostId,
    host,
    guest,
    listing_title,
    check_in,
    check_out,
    guests,
    total_price,
    status = 'PENDING' // Default status if not provided
  } = req.body;

  // Validate required fields
  if (!hostId || !host || !guest || !listing_title || !check_in || !check_out || !guests || !total_price) {
    return res.status(400).json({ 
      message: 'All fields are required: hostId, host, guest, listingId, listing_title, check_in, check_out, guests, total_price' 
    });
  }

  // Validate dates
  if (new Date(check_out) <= new Date(check_in)) {
    return res.status(400).json({ 
      message: 'Check-out date must be after check-in date' 
    });
  }

  const newReservation = {
    hostId,
    host,
    guest,
    listing_title,
    check_in,
    check_out,
    guests: Number(guests),
    total_price: Number(total_price),
    status,
  };

  try {
    const result = await reservationCollection.insertOne(newReservation);
    
    // Return the created reservation in the desired format
    res.status(201).json({
      message: 'Reservation created successfully',
      reservation: {
        ...newReservation,
        _id: result.insertedId
      }
    });
  } catch (err) {
    console.error('Error creating reservation:', err);
    res.status(500).json({ 
      message: 'Error creating reservation',
      error: err.message 
    });
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
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status input
    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${validStatuses.join('  , ')}`
      });
    }

    // Validate and convert ID
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (err) {
      console.error('Invalid ObjectId:', err);
      return res.status(400).json({ message: 'Invalid reservation ID format' });
    }

    // Verify the reservation exists and belongs to this host
    const reservation = await reservationCollection.findOne({ 
      _id: objectId,
      $or: [
        { hostId: req.user.hostId },
        { listingId: { $in: await getHostListingIds(req.user.hostId) } }
      ]
    });

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found or not authorized' });
    }

    // Update reservation
    const result = await reservationCollection.updateOne(
      { _id: objectId },
      { $set: { status } }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({ message: 'Failed to update reservation' });
    }

    // Return the updated reservation
    const updatedReservation = await reservationCollection.findOne({ _id: objectId });
    res.json({ 
      success: true,
      message: 'Reservation status updated',
      reservation: updatedReservation
    });

  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ 
      message: 'Internal server error',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Helper function to get host's listing IDs
async function getHostListingIds(hostId) {
  const db = client.db(DB_NAME);
  const listings = await db.collection('Listings')
    .find({ 
      $or: [
        { hostId: hostId },
        { 'host.host_id': hostId }
      ]
    })
    .project({ _id: 1 })
    .toArray();
  return listings.map(l => l._id);
}

export default reservationRouter;
