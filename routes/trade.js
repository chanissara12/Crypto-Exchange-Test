const express = require('express');
const router = express.Router();
const path = require('path');
const { Offer, Wallet, Transaction, sequelize } = require('../models/model');

// GET /trade/:id — serve trade page
router.get('/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/trade.html'));
});

// GET /trade/:id/wallets?userId=xxx — get user wallet balances for relevant currencies
router.get('/:id/wallets', async (req, res) => {
    try {
        const offerId = req.params.id;
        const { userId } = req.query;

        if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

        const offer = await Offer.findByPk(offerId);
        if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });

        const userWallets = await Wallet.findAll({ where: { user_id: userId } });

        // Return balances for both currencies involved in this offer
        const baseWallet = userWallets.find(w => w.currency_id === offer.crypto_currency_id);
        const quoteWallet = userWallets.find(w => w.currency_id === offer.fiat_currency_id);

        res.json({
            success: true,
            wallets: {
                [offer.crypto_currency_id]: baseWallet ? parseFloat(baseWallet.balance || baseWallet.currency_balance || 0) : 0,
                [offer.fiat_currency_id]: quoteWallet ? parseFloat(quoteWallet.balance || quoteWallet.currency_balance || 0) : 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

// POST /trade/:id — execute trade
router.post('/:id', async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const offerId = req.params.id;
        const { userId, amount } = req.body;

        if (!userId || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Invalid request data' });
        }

        const qty = parseFloat(amount);

        const offer = await Offer.findByPk(offerId, { transaction: t });
        if (!offer) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        if (offer.status !== 'OPEN') {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Offer is no longer open' });
        }
        if (offer.user_id === userId) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'You cannot trade against your own offer' });
        }
        if (qty > offer.available) {
            await t.rollback();
            return res.status(400).json({ success: false, message: `Amount exceeds offer available (${offer.available} ${offer.crypto_currency_id})` });
        }

        const total = parseFloat((qty * offer.price).toFixed(8));
        const FEE_RATE = 0.001;
        let fee = parseFloat((total * FEE_RATE).toFixed(8));

        if (total > offer.order_limit) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: `Total exceeds order limit of ${offer.order_limit} ${offer.fiat_currency_id}`
            });
        }

        // --- Wallet logic ---

        let takerSpendCurrency, takerSpendAmount, takerReceiveCurrency, takerReceiveAmount;

        if (offer.type === 'BUY') {
            takerSpendCurrency = offer.crypto_currency_id;
            takerSpendAmount = qty;
            takerReceiveCurrency = offer.fiat_currency_id;
            takerReceiveAmount = parseFloat((total - fee).toFixed(8));
        } else {
            takerSpendCurrency = offer.fiat_currency_id;
            takerSpendAmount = total;
            takerReceiveCurrency = offer.crypto_currency_id;
            fee = parseFloat((qty * FEE_RATE).toFixed(8)); // Adjust fee to be deducted from crypto received
            takerReceiveAmount = parseFloat((qty - fee).toFixed(8));
        }

        // Check taker has enough balance
        const [spendWallet] = await Wallet.findOrCreate({
            where: { user_id: userId, currency_id: takerSpendCurrency },
            defaults: { balance: 0, currency_balance: 0 },
            transaction: t
        });

        const spendBalance = parseFloat(spendWallet.balance !== undefined ? spendWallet.balance : spendWallet.currency_balance);

        if (spendBalance < takerSpendAmount) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: `Insufficient ${takerSpendCurrency} balance. You have ${spendBalance.toFixed(8)}, need ${takerSpendAmount.toFixed(8)}`
            });
        }

        const [receiveWallet] = await Wallet.findOrCreate({
            where: { user_id: userId, currency_id: takerReceiveCurrency },
            defaults: { balance: 0, currency_balance: 0 },
            transaction: t
        });

        // Deduct from taker spend wallet
        if (spendWallet.balance !== undefined) {
            spendWallet.balance = parseFloat((spendBalance - takerSpendAmount).toFixed(8));
        } else {
            spendWallet.currency_balance = parseFloat((spendBalance - takerSpendAmount).toFixed(8));
        }
        await spendWallet.save({ transaction: t });

        // Add to taker receive wallet (create if doesn't exist)
        const receiveBalance = parseFloat(receiveWallet.balance !== undefined ? receiveWallet.balance : receiveWallet.currency_balance);
        if (receiveWallet.balance !== undefined) {
            receiveWallet.balance = parseFloat((receiveBalance + takerReceiveAmount).toFixed(8));
        } else {
            receiveWallet.currency_balance = parseFloat((receiveBalance + takerReceiveAmount).toFixed(8));
        }
        await receiveWallet.save({ transaction: t });

        // Update offer
        offer.available = parseFloat((offer.available - qty).toFixed(8));
        offer.order_limit = parseFloat((offer.order_limit - total).toFixed(8));
        if (offer.available <= 0) {
            offer.status = 'CLOSED';
        }
        await offer.save({ transaction: t });

        // Append transaction
        const newTransaction = await Transaction.create({
            user_id: userId,
            trader_id: offer.user_id,
            offer_id: offer.id || offer.offer_id,
            price: parseFloat(offer.price),
            quantity: qty,
            fee,
        }, { transaction: t });

        await t.commit();

        res.json({
            success: true,
            message: 'Trade executed successfully',
            transaction: newTransaction,
            updatedOffer: {
                available: offer.available,
                order_limit: offer.order_limit,
                status: offer.status
            },
            updatedWallets: {
                [takerSpendCurrency]: parseFloat(spendWallet.balance !== undefined ? spendWallet.balance : spendWallet.currency_balance),
                [takerReceiveCurrency]: parseFloat(receiveWallet.balance !== undefined ? receiveWallet.balance : receiveWallet.currency_balance)
            }
        });

    } catch (error) {
        await t.rollback();
        console.error('Trade error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

module.exports = router;