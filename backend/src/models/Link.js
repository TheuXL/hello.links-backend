const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema(
  {
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
    linkType: {
      type: String,
      enum: ['redirect', 'image', 'file', 'text'],
      default: 'redirect',
      required: true,
    },
  originalUrl: {
    type: String,
      required: function() { return this.linkType === 'redirect'; },
  },
    content: {
      type: mongoose.Schema.Types.Mixed, // Permite qualquer tipo de dado (objetos, strings, etc.)
      required: false, // O conteúdo é opcional e depende da lógica de negócio
    },
    alias: {
    type: String,
    required: true,
    unique: true,
      index: true,
  },
    passwordHash: {
    type: String, 
      required: false,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    qrCodeGeneratedAt: {
        type: Date,
        required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Link = mongoose.model('Link', linkSchema);

module.exports = Link;
