const mongoose = require('mongoose');

const LinkEditSchema = new mongoose.Schema({
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
  changes: {
    // Store what fields were changed
    editableSlug: {
      oldValue: { type: String },
      newValue: { type: String }
    },
    originalUrl: {
      oldValue: { type: String },
      newValue: { type: String }
    },
    title: {
      oldValue: { type: String },
      newValue: { type: String }
    },
    description: {
      oldValue: { type: String },
      newValue: { type: String }
    },
    tags: {
      oldValue: [{ type: String }],
      newValue: [{ type: String }]
    },
    expiresAt: {
      oldValue: { type: Date },
      newValue: { type: Date }
    },
    isActive: {
      oldValue: { type: Boolean },
      newValue: { type: Boolean }
    }
  },
  ipAddress: { type: String },
  userAgent: { type: String },
  editType: {
    type: String,
    enum: ['create', 'update', 'delete', 'restore'],
    required: true
  }
});

// Add index for faster querying
LinkEditSchema.index({ linkId: 1, timestamp: -1 });

module.exports = mongoose.model('LinkEdit', LinkEditSchema); 