import express from 'express';
import { createReservation, getReservationsByGuest, getReservationsByListing, updateReservationStatus } from './models/Reservation.js';

const router = express.Router();

// Route to create a reservation
router.post('/reservation', async (req, res) => {
  const { guestId, listingId, startDate, endDate } = req.body;
  const result = await createReservation(guestId, listingId, new Date(startDate), new Date(endDate));
  res.json(result);
});

// Route to get all reservations for a guest
router.get('/reservations/guest/:guestId', async (req, res) => {
  const guestId = req.params.guestId;
  const reservations = await getReservationsByGuest(guestId);
  res.json(reservations);
});

// Route to get all reservations for a listing
router.get('/reservations/listing/:listingId', async (req, res) => {
  const listingId = req.params.listingId;
  const reservations = await getReservationsByListing(listingId);
  res.json(reservations);
});

// Route to update reservation status
router.put('/reservation/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await updateReservationStatus(id, status);
  res.json(result);
});

export default router;
