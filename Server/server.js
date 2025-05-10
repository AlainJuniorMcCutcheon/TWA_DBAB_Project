import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routers/authRouter.js';
import hostRouter from './routers/hostRouter.js';
import guestRouter from './routers/GuestRouter.js';
import listingRouter from './routers/listingRouter.js';
import { authenticateHost } from './middleware/authMiddleware.js';

dotenv.config();

// Initialize the app
const app = express();

// Configure CORS properly
const allowedOrigins = ['http://localhost:5173']; // Add production URL when needed

const corsOptions = {
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true, // Required for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());

// Routes
app.use('/auth', authRouter);
app.use('/host', hostRouter);
app.use('/guest', guestRouter);
app.use('/listings', listingRouter);

// Protected host route example
app.get('/api/hosts/dashboard', authenticateHost, (req, res) => {
  res.json({ message: 'Welcome to your dashboard' });
});

// Connect to MongoDB using Mongoose
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("Connected to MongoDB via Mongoose.");
  app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
  });
})
.catch((err) => {
  console.error("Error connecting to MongoDB:", err);
  process.exit(1); // Exit process with failure
});
