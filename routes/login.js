const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const { User } = require('../models/model');

const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/login.html'));
});

router.post('/', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Find user by email
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Compare passwords
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Login successful
        res.json({ 
            success: true, 
            message: 'Login successful',
            userId: user.id,
            email: user.email,
            userName: user.user_name
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message
        });
    }
});

module.exports = router;