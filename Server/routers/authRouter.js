import express from 'express';
const router = express.Router();

router.post('/register', (req, res) => {
  res.send("Registration successful");
});

router.post('/login', (req, res) => {
  res.send("Login successful");
});

export default router; 
