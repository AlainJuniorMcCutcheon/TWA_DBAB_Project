import express from 'express';
import mongoose from 'mongoose';
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
app.use('/auth', authRouter);
app.use('/host', hostRouter);
app.use('/guest', guestRouter);
app.use('/listings', listingRouter);


// Connect to MongoDB using Mongoose
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("Connected to MongoDB via Mongoose.");
  app.listen(5000, () => {
    console.log("Server running on port 5000");
  });
})
.catch((err) => {
  console.error("Error connecting to MongoDB:", err);
});

