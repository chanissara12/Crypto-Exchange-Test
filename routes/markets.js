// ไฟล์: routes/users.js
const express = require('express');
const router = express.Router();
const path = require('path');
const { Offer, User } = require('../models/model');

// Get all users (Path จริงจะเป็น /users)
router.get('/', (req, res) => {
  try {
        res.sendFile(path.join(__dirname, '../templates/markets.html'));
    } catch (error) {
        res.status(500).json({ message: 'Error loading offers: ' + error.message });
    }
});

// Get offers data as JSON (separate API endpoint)
router.get('/api/data', async (req, res) => {
  try {
    const offers = await Offer.findAll({
      include: [{ model: User, as: 'user', attributes: ['user_name'] }]
    });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: 'Error loading offers: ' + error.message });
  }
});

// Get user by ID (Path จริงจะเป็น /users/:id)
router.get('/:id', (req, res) => {
  res.send(`ดึงข้อมูล offer ID: ${req.params.id}`);
});

// Create new user (Path จริงจะเป็น POST /users)
router.post('/', (req, res) => {
  res.send('สร้าง offer ใหม่');
});

// ส่งออก router เพื่อนำไปใช้ในไฟล์ app.js
module.exports = router;