const URL = require('../models/URL');
const shortid = require('shortid');

// Create a short URL
exports.createShortUrl = async (req, res) => {
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
};

// Get all URLs for a user
exports.getUrls = async (req, res) => {
  try {
    // Retrieve all URLs for the logged-in user
    const urls = await URL.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json(urls);
  } catch (error) {
    console.error('Fetch URLs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Redirect to long URL and count clicks
exports.redirectUrl = async (req, res) => {
  try {
    const { shortUrl } = req.params;

    // Find URL by short URL
    const url = await URL.findOne({ shortUrl });
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    // Increment click count
    url.clicks++;
    await url.save();

    // Redirect to long URL
    res.redirect(url.longUrl);
  } catch (error) {
    console.error('Redirect URL error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
