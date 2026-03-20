const express = require('express');
const router = express.Router();
const path = require('path');
const { Wallet, sequelize } = require('../models/model');

// GET /deposit — serve deposit page
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/deposit.html'));
});

// POST /deposit — process the deposit transaction
router.post('/', async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { userId, currencyId, amount } = req.body;

        if (!userId || !currencyId || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Invalid request data' });
        }

        const depositAmount = parseFloat(amount);

        // Find or create wallet for the user and currency
        const [wallet] = await Wallet.findOrCreate({
            where: { user_id: userId, currency_id: currencyId },
            defaults: { balance: 0, currency_balance: 0 },
            transaction: t
        });

        // Add the deposit amount to the wallet balance
        if (wallet.balance !== undefined) {
            wallet.balance = parseFloat((parseFloat(wallet.balance) + depositAmount).toFixed(8));
        } else {
            wallet.currency_balance = parseFloat((parseFloat(wallet.currency_balance) + depositAmount).toFixed(8));
        }

        await wallet.save({ transaction: t });
        await t.commit();

        res.json({ success: true, message: 'Deposit successful' });
    } catch (error) {
        await t.rollback();
        console.error('Deposit error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

module.exports = router;
