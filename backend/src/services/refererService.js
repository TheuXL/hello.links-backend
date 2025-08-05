/**
 * Service for analyzing and categorizing referer URLs
 */

/**
 * Categorizes a referer URL into predefined traffic sources
 * @param {string} referer - The referer URL
 * @returns {string} - The category (social, search, email, direct, other)
 */
const categorizeReferer = (referer) => {
    if (!referer) return 'direct';
    
    try {
        // Try to parse the URL to extract domain
        const domain = new URL(referer).hostname.toLowerCase();
        
        // Define domain patterns for different categories
        const patterns = {
            social: [
                'facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com', 
                'pinterest.com', 'reddit.com', 'tumblr.com', 't.co', 'tiktok.com',
                'youtube.com', 'whatsapp.com', 'telegram.org', 'snapchat.com',
                'discord.com', 'medium.com'
            ],
            search: [
                'google.', 'bing.com', 'yahoo.com', 'duckduckgo.com', 'baidu.com',
                'yandex.', 'search.', 'ask.com', 'aol.com', 'ecosia.org',
                'qwant.com', 'startpage.com'
            ],
            email: [
                'mail.google.com', 'outlook.com', 'yahoo.mail', 'protonmail.com',
                'mail.', 'outlook.live.com', 'zoho.com', 'gmx.', 'aol.mail'
            ],
            ads: [
                'ads.', 'adwords.', 'doubleclick.net', 'googleadservices.com',
                'facebook.com/ads', 'linkedin.com/ads', 'twitter.com/i/cards'
            ]
        };
        
        // Check each category
        for (const [category, domainList] of Object.entries(patterns)) {
            if (domainList.some(d => domain.includes(d))) {
                return category;
            }
        }
        
        // If no match found, return 'other'
        return 'other';
    } catch (error) {
        // If URL parsing fails, return 'unknown'
        return 'unknown';
    }
};

/**
 * Analyzes UTM parameters from query string
 * @param {object} queryParams - The query parameters object
 * @returns {object} - UTM data
 */
const extractUtmData = (queryParams) => {
    return {
        source: queryParams.utm_source || null,
        medium: queryParams.utm_medium || null,
        campaign: queryParams.utm_campaign || null,
        term: queryParams.utm_term || null,
        content: queryParams.utm_content || null
    };
};

module.exports = {
    categorizeReferer,
    extractUtmData
}; 