const express = require('express');
const path = require('path');
const { Offer } = require('../models/model');

const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/offer.html'));
});

// POST /offer — Create a new offer
router.post('/', async (req, res) => {
    try {
        const newOffer = await Offer.create({ ...req.body });

        res.status(201).json({ success: true, message: 'Offer created successfully', offer: newOffer });

    } catch (error) {
        console.error('Error creating offer:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

module.exports = router;
