import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routers/authRouter.js';
import hostRouter from './routers/hostRouter.js';
import guestRouter from './routers/GuestRouter.js';
import listingRouter from './routers/listingRouter.js';

dotenv.config();

// MongoDB URI from .env
const mongoUri = process.env.MONGO_URI;

// Initialize the app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/host', hostRouter);
app.use('/api/guest', guestRouter);
app.use('/api/listings', listingRouter);

// Connect to MongoDB
const client = new MongoClient(mongoUri);

client.connect()
  .then(() => {
    console.log("Connected to MongoDB Atlas.");
    // Start the server only after the connection is established
    app.listen(5000, () => {
      console.log("Server running on port 5000");
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB Atlas:", err);
  });

