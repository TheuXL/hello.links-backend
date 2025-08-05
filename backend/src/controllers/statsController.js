const Click = require('../models/Click');
const Link = require('../models/Link');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const clickService = require('../services/clickService');
const statsService = require('../services/statsService');
const exportService = require('../services/exportService');

const getLinkStats = async (req, res, next) => {
    try {
        const { linkId } = req.params;

        // Verify the link belongs to the user
        const link = await Link.findOne({ _id: linkId, userId: req.user._id });
        if (!link) {
            res.status(404);
            throw new Error('Link not found or user not authorized.');
        }

        const clicks = await Click.find({ linkId: linkId });

        // Count unique visitors (first visits)
        const uniqueVisitors = await Click.countDocuments({ 
            linkId: linkId, 
            isFirstVisit: true 
        });

        const totalClicks = clicks.length;

        res.json({
            totalClicks,
            uniqueVisitors,
            alias: link.alias,
            originalUrl: link.originalUrl,
            clicks, // Sending raw clicks for now
        });

    } catch (error) {
        next(error);
    }
};

const getLinkQRCode = async (req, res, next) => {
    try {
        const { linkId } = req.params;

        // Verify the link belongs to the user
        const link = await Link.findOne({ _id: linkId, userId: req.user._id });
        if (!link) {
            res.status(404);
            throw new Error('Link not found or user not authorized.');
        }

        // Use the custom domain from environment variables, with a fallback for safety.
        const domain = process.env.CUSTOM_DOMAIN || 'http://helo.fyi';
        // Ensure no trailing slash from domain and no leading slash on alias
        const fullShortUrl = `${domain.replace(/\/$/, '')}/${link.alias}`;

        // Generate QR code as a data URL
        const qrCodeDataUrl = await QRCode.toDataURL(fullShortUrl, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            margin: 2,
            scale: 8,
        });

        // If this is the first time a QR code is generated for this link, mark it.
        if (!link.qrCodeGeneratedAt) {
            link.qrCodeGeneratedAt = new Date();
            await link.save();
        }

        // Send the QR code data URL in the response
        res.json({
            linkId,
            qrCodeDataUrl,
            fullShortUrl // Also sending the URL for debugging/display
        });

    } catch (error) {
        next(error);
    }
};

const getClicksByLocalHour = async (req, res, next) => {
    try {
        const { linkId } = req.params;

        // Verify the link belongs to the user
        const link = await Link.findOne({ _id: linkId, userId: req.user._id });
        if (!link) {
            res.status(404);
            throw new Error('Link not found or user not authorized.');
        }

        // Get all clicks for this link
        const clicks = await Click.find({ linkId });
        
        // Group clicks by hour using timezone information
        const hourlyClicks = {};
        
        // Initialize all hours to 0
        for (let i = 0; i < 24; i++) {
            hourlyClicks[i] = 0;
        }
        
        // Process each click to determine local hour
        clicks.forEach(click => {
            // Default to UTC if no timezone info
            let localHour;
            
            if (click.timestamp) {
                const clickTime = new Date(click.timestamp);
                
                // If we have timezone info, try to use it
                if (click.geo && click.geo.timezone) {
                    try {
                        // Convert UTC time to local time based on timezone
                        const options = { timeZone: click.geo.timezone, hour: '2-digit', hour12: false };
                        localHour = parseInt(clickTime.toLocaleString('en-US', options).split(':')[0], 10);
                    } catch (e) {
                        // Fallback to UTC hour if timezone conversion fails
                        localHour = clickTime.getUTCHours();
                    }
                } else {
                    // No timezone info, use UTC
                    localHour = clickTime.getUTCHours();
                }
                
                // Increment the count for this hour
                hourlyClicks[localHour] = (hourlyClicks[localHour] || 0) + 1;
            }
        });
        
        // Convert to array format for easier frontend processing
        const hourlyClicksArray = Object.keys(hourlyClicks).map(hour => ({
            hour: parseInt(hour),
            count: hourlyClicks[hour]
        })).sort((a, b) => a.hour - b.hour);
        
        res.json({
            linkId,
            hourlyClicks: hourlyClicksArray
        });
    } catch (error) {
        next(error);
    }
};

const getGeoStats = async (req, res, next) => {
    try {
        const { linkId } = req.params;
        const { groupBy } = req.query; // 'country', 'state', or 'city'

        const linkExists = await Link.exists({ _id: linkId, userId: req.user._id });
        if (!linkExists) {
            res.status(404);
            throw new Error('Link not found or user not authorized.');
        }

        const geoData = await statsService.getClicksByGeo(linkId, groupBy);
        
        res.json({
            linkId,
            groupBy: groupBy || 'country',
            data: geoData
        });
    } catch (error) {
        // Handle specific errors, like invalid groupBy
        if (error.message.includes("Invalid 'groupBy' parameter")) {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};

const getTrafficByCategory = async (req, res, next) => {
    try {
        const { linkId } = req.params;

        // Verify the link belongs to the user
        const link = await Link.findOne({ _id: linkId, userId: req.user._id });
        if (!link) {
            res.status(404);
            throw new Error('Link not found or user not authorized.');
        }

        // Aggregate clicks by referer category
        const trafficByCategory = await Click.aggregate([
            { $match: { linkId: linkId } },
            { $group: {
                _id: "$refererCategory",
                count: { $sum: 1 }
            }},
            { $project: {
                category: "$_id",
                count: 1,
                _id: 0
            }},
            { $sort: { count: -1 } }
        ]);
        
        res.json({
            linkId,
            trafficByCategory
        });
    } catch (error) {
        next(error);
    }
};

const getFloodEvents = async (req, res, next) => {
    try {
        const { linkId } = req.params;

        const linkExists = await Link.exists({ _id: linkId, userId: req.user._id });
        if (!linkExists) {
            res.status(404);
            throw new Error('Link not found or user not authorized.');
        }

        const floodEvents = await statsService.getIpFloodEventsByLinkId(linkId);
        
        res.json({
            linkId,
            floodEvents
        });
    } catch (error) {
        next(error);
    }
};

const exportClicksCSV = async (req, res, next) => {
    try {
        const { linkId } = req.params;
        const link = await Link.findOne({ _id: linkId, userId: req.user._id });
        if (!link) {
            res.status(404);
            throw new Error('Link not found or user not authorized.');
        }
        const clicks = await Click.find({ linkId }).sort({ timestamp: -1 });
        const csv = exportService.exportClicksToCsv(clicks);
        const filename = `report_${link.alias}_${exportService.formatDateForFilename()}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(csv);
    } catch (error) {
        next(error);
    }
};

const exportClicksPDF = async (req, res, next) => {
    try {
        const { linkId } = req.params;
        const link = await Link.findOne({ _id: linkId, userId: req.user._id });
        if (!link) {
            res.status(404);
            throw new Error('Link not found or user not authorized.');
        }
        const clicks = await Click.find({ linkId }).sort({ timestamp: -1 });
        const pdfBuffer = await exportService.exportClicksToPdf(clicks, {
            alias: link.alias,
            originalUrl: link.originalUrl
        });
        const filename = `report_${link.alias}_${exportService.formatDateForFilename()}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);
    } catch (error) {
        next(error);
    }
};

const getGeoHeatmapData = async (req, res, next) => {
    try {
        const { linkId } = req.params;

        // Verify the link belongs to the user
        const link = await Link.findOne({ _id: linkId, userId: req.user._id });
        if (!link) {
            res.status(404);
            throw new Error('Link not found or user not authorized.');
        }

        // Get geo data for clicks with valid coordinates
        const geoData = await Click.aggregate([
            { 
                $match: { 
                    linkId: mongoose.Types.ObjectId(linkId),
                    'geo.latitude': { $ne: null },
                    'geo.longitude': { $ne: null }
                } 
            },
            { 
                $group: {
                    _id: {
                        lat: '$geo.latitude',
                        lng: '$geo.longitude',
                        country: '$geo.country',
                        city: '$geo.city'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    lat: '$_id.lat',
                    lng: '$_id.lng',
                    country: '$_id.country',
                    city: '$_id.city',
                    weight: '$count'
                }
            }
        ]);
        
        res.json({
            linkId,
            geoData
        });
    } catch (error) {
        next(error);
    }
};

const getLatencyEvents = async (req, res, next) => {
    try {
        const { linkId } = req.params;
        const events = await clickService.getHighLatencyEvents(linkId);
        res.json({
            threshold: clickService.HIGH_LATENCY_THRESHOLD,
            count: events.length,
            events,
        });
    } catch (error) {
        next(error);
    }
};

const getTrafficSpikes = async (req, res, next) => {
    try {
        const { linkId } = req.params;

        const linkExists = await Link.exists({ _id: linkId, userId: req.user._id });
        if (!linkExists) {
            res.status(404);
            throw new Error('Link not found or user not authorized.');
        }

        const trafficSpikes = await statsService.getTrafficSpikesByLinkId(linkId);
        res.json({
            linkId: linkId,
            trafficSpikes: trafficSpikes
        });
    } catch (error) {
        next(error);
    }
};

const getUtmStats = async (req, res, next) => {
    try {
        const { linkId } = req.params;
        const { groupBy } = req.query; // 'source', 'medium', 'campaign', 'term', 'content'

        const linkExists = await Link.exists({ _id: linkId, userId: req.user._id });
        if (!linkExists) {
            res.status(404);
            throw new Error('Link not found or user not authorized.');
        }

        const utmData = await statsService.getStatsByUtm(linkId, groupBy);
        
        res.json({
            linkId,
            groupBy: groupBy || 'source',
            data: utmData
        });
    } catch (error) {
        if (error.message.includes("Invalid 'groupBy' parameter")) {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};

const getRetentionData = async (req, res, next) => {
    try {
        const { linkId } = req.params;
        const days = req.query.days ? parseInt(req.query.days, 10) : 30;

        const linkExists = await Link.exists({ _id: linkId, userId: req.user._id });
        if (!linkExists) {
            res.status(404);
            throw new Error('Link not found or user not authorized.');
        }

        const retentionData = await statsService.getRetentionData(linkId, days);
        
        res.json({
            linkId,
            retentionData
        });
    } catch (error) {
        next(error);
    }
};

const getDeviceStats = async (req, res, next) => {
    try {
        const { linkId } = req.params;
        const { groupBy } = req.query; // 'type', 'os', or 'browser'

        const linkExists = await Link.exists({ _id: linkId, userId: req.user._id });
        if (!linkExists) {
            res.status(404);
            throw new Error('Link not found or user not authorized.');
        }

        const deviceData = await statsService.getStatsByDeviceProperty(linkId, groupBy);
        
        res.json({
            linkId,
            groupBy: groupBy || 'type',
            data: deviceData
        });
    } catch (error) {
        if (error.message.includes("Invalid 'groupBy' parameter")) {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};

const getBotStats = async (req, res, next) => {
    try {
        const { linkId } = req.params;

        const linkExists = await Link.exists({ _id: linkId, userId: req.user._id });
        if (!linkExists) {
            res.status(404);
            throw new Error('Link not found or user not authorized.');
        }

        const botData = await statsService.getBotStats(linkId);
        
        res.json({
            linkId,
            ...botData
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getLinkStats,
    getLinkQRCode,
    getClicksByLocalHour,
    getGeoStats,
    getTrafficByCategory,
    getFloodEvents,
    exportClicksCSV,
    exportClicksPDF,
    getGeoHeatmapData,
    getLatencyEvents,
    getTrafficSpikes,
    getUtmStats,
    getRetentionData,
    getDeviceStats,
    getBotStats,
};
