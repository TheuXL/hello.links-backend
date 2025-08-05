const mongoose = require('mongoose');

const trafficSpikeSchema = new mongoose.Schema({
    linkId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Link',
        required: true,
        index: true,
    },
    spikeCount: {
        type: Number,
        required: true,
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

const TrafficSpike = mongoose.model('TrafficSpike', trafficSpikeSchema, 'traffic_spikes');

module.exports = TrafficSpike; 