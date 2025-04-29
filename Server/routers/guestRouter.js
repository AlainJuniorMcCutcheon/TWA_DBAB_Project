import express from "express";
const router = express.Router();

router.get("/search", (req, res) => {
  res.send("Search for listings");
});

router.post("/book", (req, res) => {
  res.send("Booking a listing");
});

export default router; 
