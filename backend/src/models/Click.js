const mongoose = require('mongoose');

const ClickSchema = new mongoose.Schema({
  linkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Link',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  ip: { type: String },
  geo: {
    country: { type: String },
    city: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    asn: { type: Number },
    isp: { type: String },
    timezone: { type: String },
  },
  device: {
    type: String, // Desktop, Mobile, Tablet
    os: String,
    browser: String
  },
  referer: { type: String },
  refererCategory: { 
    type: String, 
    enum: ['social', 'search', 'email', 'ads', 'direct', 'other', 'unknown'],
    default: 'unknown'
  },
  utm: {
    source: { type: String },
    medium: { type: String },
    campaign: { type: String },
    term: { type: String },
    content: { type: String },
  },
  language: { type: String },
  isBot: { type: Boolean, default: false },
  securityFlags: {
    isVpn: { type: Boolean },
    isTor: { type: Boolean },
    isProxy: { type: Boolean },
    isMalicious: { type: Boolean },
  },
  redirectLatencyMs: { type: Number },
  isHighLatency: { type: Boolean, default: false },
  isFirstVisit: { type: Boolean, default: false },
});

// Add index for faster querying
ClickSchema.index({ linkId: 1, timestamp: -1 });
ClickSchema.index({ ip: 1, linkId: 1 });

module.exports = mongoose.model('Click', ClickSchema);
