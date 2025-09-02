const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const router = express.Router();

// NOTE: As mentioned before, it is highly recommended to hash passwords using a library like 'bcryptjs'
// instead of storing them as plain text. This code is functional but not secure for production.

// Register a new user
router.post('/register', async (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password, // TODO: Hash this password before saving
        testResults: req.body.testResults,
    });

    try {
        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // TODO: Replace this plain text comparison with a secure hash comparison
        if (req.body.password === user.password) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ message: 'Login successful', token, user });
        } else {
            res.status(400).json({ message: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a specific user by ID
router.get('/:id', getUser, (req, res) => {
    res.json(res.user);
});

// Update a user
router.patch('/:id', getUser, async (req, res) => {
    if (req.body.name != null) { res.user.name = req.body.name; }
    if (req.body.email != null) { res.user.email = req.body.email; }
    if (req.body.password != null) { res.user.password = req.body.password; }
    if (req.body.testResults != null) { res.user.testResults = req.body.testResults; }

    try {
        const updatedUser = await res.user.save();
        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a user
router.delete('/:id', getUser, async (req, res) => {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.json({ message: 'User deleted' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });


// Middleware function to get a specific user by ID
async function getUser(req, res, next) {
    let user;
    try {
        user = await User.findById(req.params.id);
        if (user == null) {
            return res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

    res.user = user;
    next();
}

module.exports = router;