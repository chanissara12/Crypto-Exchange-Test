const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const { User } = require('../models/model');

const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/register.html'));
});

router.post('/', async (req, res) => {
    try {
        const { email, user_name, password } = req.body;
        
        // Validate input
        if (!email || !user_name || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email already exists' 
            });
        }

        // Hash the password before saving
        const password_hash = await bcrypt.hash(password, 10);

        // Create user
        await User.create({ email, user_name, password_hash });

        res.status(201).json({ 
            success: true, 
            message: 'Registration successful'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message
        });
    }
});

module.exports = router;
