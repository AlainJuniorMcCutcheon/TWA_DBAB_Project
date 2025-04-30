import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Host route working');
});

export default router;
