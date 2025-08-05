const Click = require('../models/Click');
const Link = require('../models/Link');
const { analyzeClick } = require('./pythonService');
const { categorizeReferer, extractUtmData } = require('./refererService');

// Threshold for high latency in milliseconds
const HIGH_LATENCY_THRESHOLD = 500;

const processClick = async (link, clickData, redirectLatencyMs) => {
    try {
        // Increment click count without waiting for it to complete
        Link.updateOne({ _id: link._id }, { $inc: { clickCount: 1 } }).exec();

        let enrichedData = {};
        try {
            // Attempt to get enriched data from Python service
            enrichedData = await analyzeClick({
            ip: clickData.ip,
            user_agent: clickData.userAgent,
        });
        } catch (analysisError) {
            console.error('Failed to get enriched data from Python service:', analysisError.message);
            // Continue with empty enrichedData, so the click is still saved
        }

        // Extract and process UTM parameters
        const utm = extractUtmData(clickData.queryParams);

        // Categorize the referer
        const refererCategory = categorizeReferer(clickData.referer);

        // Check if this IP has visited this link before
        const previousVisit = await Click.findOne({
            linkId: link._id,
            ip: clickData.ip
        });

        // If no previous visit found, this is the first visit
        const isFirstVisit = !previousVisit;
        
        // Determine if redirect latency is high
        const isHighLatency = redirectLatencyMs > HIGH_LATENCY_THRESHOLD;
        
        // If latency is very high, log it for monitoring
        if (isHighLatency) {
            console.warn(`High redirect latency detected: ${redirectLatencyMs}ms for link ${link._id}`);
        }

        const click = new Click({
            linkId: link._id,
            userId: link.userId,
            ip: clickData.ip,
            geo: enrichedData?.geo,
            device: {
                type: enrichedData?.device?.type,
                os: [enrichedData?.os?.name, enrichedData?.os?.version].filter(Boolean).join(' '),
                browser: [enrichedData?.browser?.name, enrichedData?.browser?.version].filter(Boolean).join(' '),
            },
            referer: clickData.referer,
            refererCategory: refererCategory,
            utm: utm,
            language: clickData.language,
            isBot: enrichedData?.isBot || false,
            redirectLatencyMs: redirectLatencyMs,
            isHighLatency: isHighLatency,
            timestamp: new Date(),
            isFirstVisit: isFirstVisit
        });

        await click.save();
    } catch (error) {
        console.error('Error processing click:', error);
    }
};

// Function to get high latency events for monitoring
const getHighLatencyEvents = async (linkId) => {
    try {
        const query = {
            redirectLatencyMs: { $gt: HIGH_LATENCY_THRESHOLD }
        };

        if (linkId) {
            query.linkId = linkId;
        }

        const events = await Click.find(query)
        .sort({ redirectLatencyMs: -1, timestamp: -1 })
        .limit(100)
        .populate('linkId', 'alias originalUrl');
        
        return events;
    } catch (error) {
        console.error('Error getting high latency events:', error);
        return [];
    }
};

module.exports = {
    processClick,
    getHighLatencyEvents,
    HIGH_LATENCY_THRESHOLD
};
