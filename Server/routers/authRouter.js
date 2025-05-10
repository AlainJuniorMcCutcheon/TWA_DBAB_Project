// !! npm install cookie-parser !!

import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = 'mongodb+srv://MrBinks:WzyKgQl7J44WKjR1@freeworld.5dellif.mongodb.net/AirBnB?retryWrites=true&w=majority&appName=FreeWorld';
const DB_NAME = 'AirBnB';

const authRouter = express.Router();
const client = new MongoClient(MONGO_URI);

// Host Registration
authRouter.post('/hosts/register', async (req, res) => {
    const { email, password, firstName, lastName, hostId } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !hostId) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        await client.connect();
        const db = client.db(DB_NAME);

        // Check if email already exists
        const existingEmail = await db.collection('Users').findOne({ email });
        if (existingEmail) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        // Check if hostId exists in listings and isn't already registered
        const listingWithHostId = await db.collection('Listings').findOne({
          $or: [
            { 'host.host_id': hostId },
            { 'host.host_id': parseInt(hostId) }, // If stored as number
            { host_id: hostId }
          ]
        });
        
        if (!listingWithHostId) {
          return res.status(400).json({ 
            message: `No listing found with host_id: ${hostId}`,
          });
        }

        const hostWithSameId = await db.collection('Users').findOne({ hostId });
        if (hostWithSameId) {
            return res.status(409).json({ message: 'Host ID already registered' });
        }

        // Validate password requirements
        if (!/\d/.test(password) || !/[A-Z]/.test(password) || password.length < 8) {
            return res.status(400).json({ 
                message: 'Password must be at least 8 characters with a number and uppercase letter' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new host
        const newHost = {
            email,
            password: hashedPassword,
            first_Name,
            last_Name,
            role: "host",
            hostId,
        };

        await db.collection('Users').insertOne(newHost);

        res.status(201).json({ 
            message: 'Host registered successfully',
            user: {
                email: newHost.email,
                firstName: newHost.firstName,
                lastName: newHost.lastName,
                hostId: newHost.hostId
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Error registering host' });
    } finally {
        await client.close();
    }
});

// Host Login
authRouter.post('/hosts/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        await client.connect();
        const db = client.db(DB_NAME);

        const host = await db.collection('Users').findOne({ email });
        if (!host) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const validPassword = await bcrypt.compare(password, host.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        

        // Create JWT token
        const token = jwt.sign(
          { 
            userId: host._id,       // Keep MongoDB's _id if needed
            hostId: host.hostId,    // This is the crucial field (51496939 from your example)
            email: host.email,
            role: host.role,
            firstName: host.firstName,
            lastName: host.lastName
          },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        // Set cookie with token
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 3600000,
          path: '/',
          domain: 'localhost'
      });

        res.json({ 
            message: 'Login successful',
            token: token,
            user: {
                email: host.email,
                firstName: host.firstName,
                lastName: host.lastName,
                hostId: host.hostId
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Error logging in' });
    } finally {
        await client.close();
    }
});

// Host Logout
authRouter.post('/hosts/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

export default authRouter;