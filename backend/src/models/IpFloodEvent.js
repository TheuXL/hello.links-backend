const mongoose = require('mongoose');

const ipFloodEventSchema = new mongoose.Schema({
    linkId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Link',
        required: true,
        index: true,
    },
    ip: {
        type: String,
        required: true,
        index: true,
    },
    clickCount: {
        type: Number,
        required: true,
    },
    clicksPerMinute: {
        type: Number,
        required: true,
    },
    isBot: {
        type: Boolean,
        default: false,
    },
    timeWindowStart: {
        type: Date,
        required: true,
    },
    timeWindowEnd: {
        type: Date,
        required: true,
    },
    detectedAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
});

const IpFloodEvent = mongoose.model('IpFloodEvent', ipFloodEventSchema, 'ip_flood_events');

module.exports = IpFloodEvent; 