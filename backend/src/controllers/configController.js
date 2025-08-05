const getConfig = (_req, res) => {
    res.json({
        customDomain: process.env.CUSTOM_DOMAIN || 'http://helo.fyi'
    });
};

module.exports = { getConfig }; 
 