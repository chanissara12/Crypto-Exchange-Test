const express = require('express');
const path = require('path');
const { User, Wallet, Offer } = require('../models/model');

const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/profile.html'));
});

// API endpoint to get user profile data
router.get('/data/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Find user by ID
        const user = await User.findByPk(userId, {
            include: [{ model: Wallet, as: 'wallets' }, { model: Offer, as: 'offers' }]
        });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        const userWallets = user.wallets || [];
        const userOffers = user.offers || [];

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                user_name: user.user_name,
                createdAt: user.createdAt
            },
            wallets: userWallets,
            offers: userOffers,
            stats: {
                totalWallets: userWallets.length,
                totalOffers: userOffers.length,
                buyOffers: userOffers.filter(o => (o.type || o.offer_type) === 'BUY').length,
                sellOffers: userOffers.filter(o => (o.type || o.offer_type) === 'SELL').length
            }
        });
    } catch (error) {
        console.error('Profile data error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message
        });
    }
});

module.exports = router;
