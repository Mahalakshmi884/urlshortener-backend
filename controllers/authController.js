const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, firstName, lastName, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate activation token
    const activationToken = crypto.randomBytes(20).toString('hex');

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    user = new User({
      username,
      firstName,
      lastName,
      password: hashedPassword,
      activationToken,
    });

    await user.save();

    // Send activation email
    const activationLink = `${req.protocol}://${req.get('host')}/api/auth/activate/${activationToken}`;
    const emailOptions = {
      from: process.env.EMAIL_USER,
      to: username,
      subject: 'Activate your account',
      html: `<p>Click <a href="${activationLink}">here</a> to activate your account.</p>`,
    };

    await sendEmail(emailOptions);

    res.status(201).json({ message: 'User registered. Check your email to activate your account.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Activate user account
exports.activateAccount = async (req, res) => {
  try {
    const { token } = req.params;

    // Find user with matching activation token
    const user = await User.findOne({ activationToken: token });
    if (!user) {
      return res.status(404).json({ message: 'Invalid or expired activation token' });
    }

    // Activate user
    user.isActive = true;
    user.activationToken = undefined;
    await user.save();

    res.redirect('http://localhost:3000/login'); // Redirect to login page
  } catch (error) {
    console.error('Activation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account not activated' });
    }

    // Generate JWT token
    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { username } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetToken = resetToken;
    await user.save();

    // Send reset password email
    const resetLink = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
    const emailOptions = {
      from: process.env.EMAIL_USER,
      to: username,
      subject: 'Reset your password',
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    };

    await sendEmail(emailOptions);

    res.status(200).json({ message: 'If the email is valid, a reset password link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Find user with matching reset token
    const user = await User.findOne({ resetToken: token });
    if (!user) {
      return res.status(404).json({ message: 'Invalid or expired reset token' });
    }

    // Encrypt new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
