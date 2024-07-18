const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, required: true },
  isActive: { type: Boolean, default: false },
  activationToken: { type: String },
  resetToken: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
