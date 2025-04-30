import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const authRouter = express.Router();
const client = new MongoClient(process.env.MONGO_URI);

authRouter.post('/register', async (req, res) => {
    const { username, password, role } = req.body;
  
    if (!username || !password || !role) {
      return res.status(400).json({ message: 'Username, password, and role are required' });
    }
  
    try {
      const db = client.db('AirBnB');
  
      const existingUser = await db.collection('Users').findOne({ username });
      if (existingUser) {
        return res.status(409).json({ message: 'Username already exists' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const newUser = {
        username,
        password: hashedPassword,
        role, // should be 'host' or 'guest'
        createdAt: new Date(),
      };
  
      await db.collection('Users').insertOne(newUser);
  
      res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Error registering user', error: err.message });
    }
  });
  
authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const db = client.db('AirBnB');
    const user = await db.collection('Users').findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

export default authRouter;
