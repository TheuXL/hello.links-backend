const TrafficSpike = require('../models/TrafficSpike');
const IpFloodEvent = require('../models/IpFloodEvent');
const Click = require('../models/Click');
const mongoose = require('mongoose');

/**
 * Retrieves traffic spike events for a specific link.
 * @param {String} linkId - The ID of the link to retrieve spike events for.
 * @returns {Promise<Array>} - A promise that resolves to an array of spike events.
 */
const getTrafficSpikesByLinkId = async (linkId) => {
    try {
        const spikes = await TrafficSpike.find({ linkId })
            .sort({ detectedAt: -1 })
            .limit(50); // Limit to the last 50 spike events for performance
        return spikes;
    } catch (error) {
        console.error(`Error fetching traffic spikes for link ${linkId}:`, error);
        throw new Error('Could not retrieve traffic spike data.');
    }
};

/**
 * Retrieves IP flood events for a specific link.
 * @param {String} linkId - The ID of the link to retrieve flood events for.
 * @returns {Promise<Array>} - A promise that resolves to an array of flood events.
 */
const getIpFloodEventsByLinkId = async (linkId) => {
    try {
        const events = await IpFloodEvent.find({ linkId })
            .sort({ detectedAt: -1 })
            .limit(100); // Limit to the last 100 events
        return events;
    } catch (error) {
        console.error(`Error fetching IP flood events for link ${linkId}:`, error);
        throw new Error('Could not retrieve IP flood event data.');
    }
};

/**
 * Aggregates click data by a geographic level (country, state, or city).
 * @param {String} linkId - The ID of the link.
 * @param {String} groupBy - The geographic level to group by ('country', 'state', 'city').
 * @returns {Promise<Array>} - A promise that resolves to an array of aggregated geo data.
 */
const getClicksByGeo = async (linkId, groupBy = 'country') => {
    const validGroupBy = ['country', 'state', 'city'];
    if (!validGroupBy.includes(groupBy)) {
        throw new Error("Invalid 'groupBy' parameter. Must be one of " + validGroupBy.join(', '));
    }

    // The field in the Click model is nested under 'geo'
    const groupId = `$geo.${groupBy}`;

    try {
        const results = await Click.aggregate([
            { $match: { 
                linkId: new mongoose.Types.ObjectId(linkId),
                [`geo.${groupBy}`]: { $ne: null, $ne: "" } 
            }},
            { $group: {
                _id: groupId,
                count: { $sum: 1 }
            }},
            { $project: {
                [groupBy]: "$_id",
                count: 1,
                _id: 0
            }},
            { $sort: { count: -1 } },
            { $limit: 100 } // Limit the number of results
        ]);
        return results;
    } catch (error) {
        console.error(`Error fetching clicks by geo (${groupBy}) for link ${linkId}:`, error);
        throw new Error('Could not retrieve geographic click data.');
    }
};

/**
 * Aggregates click data by a UTM parameter.
 * @param {String} linkId - The ID of the link.
 * @param {String} groupBy - The UTM parameter to group by ('source', 'medium', 'campaign', 'term', 'content').
 * @returns {Promise<Array>} - A promise that resolves to an array of aggregated UTM data.
 */
const getStatsByUtm = async (linkId, groupBy = 'source') => {
    const validGroupBy = ['source', 'medium', 'campaign', 'term', 'content'];
    if (!validGroupBy.includes(groupBy)) {
        throw new Error("Invalid 'groupBy' parameter. Must be one of " + validGroupBy.join(', '));
    }

    const groupId = `$utm.${groupBy}`;

    try {
        const results = await Click.aggregate([
            { $match: { 
                linkId: new mongoose.Types.ObjectId(linkId),
                [`utm.${groupBy}`]: { $ne: null, $ne: "" }
            }},
            { $group: {
                _id: groupId,
                count: { $sum: 1 }
            }},
            { $project: {
                [groupBy]: "$_id",
                count: 1,
                _id: 0
            }},
            { $sort: { count: -1 } },
            { $limit: 100 }
        ]);
        return results;
    } catch (error) {
        console.error(`Error fetching stats by UTM (${groupBy}) for link ${linkId}:`, error);
        throw new Error('Could not retrieve UTM statistics.');
    }
};

/**
 * Calculates daily click retention data for a given link over a period of days.
 * @param {String} linkId - The ID of the link.
 * @param {Number} days - The number of days to look back.
 * @returns {Promise<Array>} - A promise that resolves to an array of retention data points.
 */
const getRetentionData = async (linkId, days = 30) => {
    try {
        const endDate = new Date();
        endDate.setUTCHours(23, 59, 59, 999);

        const startDate = new Date();
        startDate.setDate(endDate.getDate() - (days - 1));
        startDate.setUTCHours(0, 0, 0, 0);

        const results = await Click.aggregate([
            {
                $match: {
                    linkId: new mongoose.Types.ObjectId(linkId),
                    timestamp: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp", timezone: "UTC" } },
                    totalClicks: { $sum: 1 },
                    // Unique visitors per day is represented by unique IPs
                    uniqueVisitors: { $addToSet: "$ip" }
                }
            },
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    totalClicks: "$totalClicks",
                    uniqueVisitors: { $size: "$uniqueVisitors" }
                }
            },
            {
                $sort: { date: 1 }
            }
        ]);

        return results.map(r => ({ ...r, date: r.date, clicks: r.totalClicks }));

    } catch (error) {
        console.error(`Error calculating retention data for link ${linkId}:`, error);
        throw new Error('Could not retrieve retention data.');
    }
};

/**
 * Aggregates click data by a device property.
 * @param {String} linkId - The ID of the link.
 * @param {String} groupBy - The device property to group by ('type', 'os', 'browser').
 * @returns {Promise<Array>} - A promise that resolves to an array of aggregated device data.
 */
const getStatsByDeviceProperty = async (linkId, groupBy = 'type') => {
    const validGroupBy = ['type', 'os', 'browser'];
    if (!validGroupBy.includes(groupBy)) {
        throw new Error("Invalid 'groupBy' parameter for device stats. Must be one of " + validGroupBy.join(', '));
    }

    const groupId = `$device.${groupBy}`;

    try {
        const results = await Click.aggregate([
            { $match: { 
                linkId: new mongoose.Types.ObjectId(linkId),
                [`device.${groupBy}`]: { $ne: null, $ne: "" } 
            }},
            { $group: {
                _id: groupId,
                count: { $sum: 1 }
            }},
            { $project: {
                [groupBy]: "$_id",
                count: 1,
                _id: 0
            }},
            { $sort: { count: -1 } },
            { $limit: 100 }
        ]);
        return results;
    } catch (error) {
        console.error(`Error fetching stats by device property (${groupBy}) for link ${linkId}:`, error);
        throw new Error('Could not retrieve device statistics.');
    }
};

/**
 * Aggregates click data to differentiate between human and bot traffic.
 * @param {String} linkId - The ID of the link.
 * @returns {Promise<Object>} - A promise that resolves to an object with human and bot counts.
 */
const getBotStats = async (linkId) => {
    try {
        const results = await Click.aggregate([
            { $match: { 
                linkId: new mongoose.Types.ObjectId(linkId)
            }},
            { $group: {
                _id: "$isBot",
                count: { $sum: 1 }
            }}
        ]);

        let humanCount = 0;
        let botCount = 0;

        results.forEach(result => {
            if (result._id === true) {
                botCount = result.count;
            } else {
                humanCount = result.count;
            }
        });

        return { humanCount, botCount };
    } catch (error) {
        console.error(`Error fetching bot stats for link ${linkId}:`, error);
        throw new Error('Could not retrieve bot statistics.');
    }
};

module.exports = {
    getTrafficSpikesByLinkId,
    getIpFloodEventsByLinkId,
    getClicksByGeo,
    getStatsByUtm,
    getRetentionData,
    getStatsByDeviceProperty,
    getBotStats,
}; 