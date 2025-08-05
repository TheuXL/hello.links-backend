const express = require('express');
const router = express.Router();
const { getLinkStats, getLinkQRCode, getClicksByLocalHour, getTrafficByCategory, getFloodEvents, exportClicksCSV, exportClicksPDF, getGeoHeatmapData, getLatencyEvents, getTrafficSpikes, getGeoStats, getUtmStats, getRetentionData, getDeviceStats, getBotStats } = require('../controllers/statsController');
const { protect } = require('../middlewares/authMiddleware');
const { checkPlanLimit } = require('../middlewares/planLimitMiddleware');

// All routes here are protected
router.use(protect);

router.get('/:linkId', getLinkStats);
router.get('/:linkId/qrcode', checkPlanLimit('generateQRCode'), getLinkQRCode);
router.get('/:linkId/hourly', getClicksByLocalHour);
router.get('/:linkId/geo', getGeoStats);
router.get('/:linkId/devices', getDeviceStats);
router.get('/:linkId/traffic-sources', getTrafficByCategory);
router.get('/:linkId/flood-events', getFloodEvents);
router.get('/:linkId/bots', getBotStats);
router.get('/:linkId/export/csv', exportClicksCSV);
router.get('/:linkId/export/pdf', exportClicksPDF);
router.get('/:linkId/geo-heatmap', getGeoHeatmapData);
router.get('/:linkId/traffic-spikes', getTrafficSpikes);
router.get('/:linkId/utm', getUtmStats);
router.get('/:linkId/retention', getRetentionData);
router.get('/:linkId/latency-events', getLatencyEvents);

// This global route can be kept for admin purposes or removed if not needed.
router.get('/latency-events', getLatencyEvents);

module.exports = router;
