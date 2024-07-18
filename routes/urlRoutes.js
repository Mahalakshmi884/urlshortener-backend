const express = require('express');
const router = express.Router();
const URL = require('../models/URL');
const shortid = require('shortid');

router.post('/', async (req, res) => {
  try {
    const { longUrl } = req.body;
    const shortUrl = shortid.generate();

    // Create new URL entry
    const newUrl = new URL({ longUrl, shortUrl, user: req.user.userId });
    await newUrl.save();

    res.status(201).json(newUrl);
  } catch (error) {
    console.error('Create URL error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    // Retrieve all URLs for the logged-in user
    const urls = await URL.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json(urls);
  } catch (error) {
    console.error('Fetch URLs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
