import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRouter from './routers/authRouter.js';
import reservationRouter from './routers/reservationRouter.js';
import { authenticateHost } from './middleware/authMiddleware.js';

dotenv.config();

// Initialize the app
const app = express();

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};

app.use(cors(corsOptions));

app.use(cookieParser());

// Handle preflight requests
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());

// Routes
app.use('/auth', authRouter);

app.use('/reservations', reservationRouter);

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
