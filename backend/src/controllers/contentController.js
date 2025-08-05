const Link = require('../models/Link');
const clickService = require('../services/clickService');
const bcrypt = require('bcryptjs');

const processClickAndServeContent = (req, res, link) => {
    const startTime = Date.now();
    const clickData = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
        queryParams: req.query,
        language: req.headers['accept-language'],
    };
    
    const latencyMs = Date.now() - startTime;
    // We don't wait for this to finish
    clickService.processClick(link, clickData, latencyMs);
    
    switch (link.linkType) {
        case 'redirect':
            if (!link.originalUrl) {
                // This case should ideally be prevented by data validation
                res.status(500);
                throw new Error('Redirect link is missing originalUrl.');
            }
            return res.redirect(301, link.originalUrl);

        case 'image':
            if (!link.content || !link.content.data || !link.content.contentType) {
                res.status(500);
                throw new Error('Image link is missing content data or contentType.');
            }
            const imageBuffer = Buffer.from(link.content.data, 'base64');
            res.setHeader('Content-Type', link.content.contentType);
            return res.send(imageBuffer);

        case 'file':
             if (!link.content || !link.content.data || !link.content.contentType || !link.content.filename) {
                res.status(500);
                throw new Error('File link is missing content data, contentType, or filename.');
            }
            const fileBuffer = Buffer.from(link.content.data, 'base64');
            res.setHeader('Content-Type', link.content.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${link.content.filename}"`);
            return res.send(fileBuffer);
        
        case 'text':
            if (!link.content || typeof link.content.text !== 'string') {
                res.status(500);
                throw new Error('Text link is missing text content.');
            }
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.send(link.content.text);

        default:
            res.status(500);
            throw new Error(`Unsupported link type: ${link.linkType}`);
    }
}

const serveContent = async (req, res, next) => {
    try {
        const { alias } = req.params;
        const link = await Link.findOne({ alias });

        if (!link) {
            res.status(404);
            throw new Error('Link not found.');
        }

        if (link.passwordHash) {
             // For password protected links accessed via GET, we ask for the password.
            return res.status(401).json({ 
                message: 'Password required to access this link.',
                action: 'POST',
                url: `/r/${alias}` // Provide the correct endpoint for POSTing the password
            });
        }
        
        return processClickAndServeContent(req, res, link);

    } catch (error) {
        next(error);
    }
};

const verifyPasswordAndServeContent = async (req, res, next) => {
    try {
        const { alias } = req.params;
        const { password } = req.body;

        if (!password) {
            res.status(400);
            throw new Error('Password must be provided.');
        }

        const link = await Link.findOne({ alias });

        if (!link || !link.passwordHash) {
            res.status(404);
            throw new Error('Link not found or is not password protected.');
        }

        const isMatch = await bcrypt.compare(password, link.passwordHash);

        if (!isMatch) {
            res.status(403);
            throw new Error('Incorrect password.');
        }
        
        return processClickAndServeContent(req, res, link);

    } catch (error) {
        next(error);
    }
};


module.exports = {
    serveContent,
    verifyPasswordAndServeContent,
}; 