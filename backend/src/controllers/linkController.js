const linkService = require('../services/linkService');
const multer = require('multer');

// Configure multer for memory storage to process files before saving
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const createLink = async (req, res, next) => {
    try {
        const { linkType, originalUrl, alias, password, textContent } = req.body;
        
        const requestInfo = {
            ip: req.ip,
            userAgent: req.headers['user-agent']
        };

        const linkData = {
            linkType,
            originalUrl,
            alias,
            password,
        };

        if (linkType === 'text' && textContent) {
            linkData.content = { text: textContent };
        }

        // If a file is uploaded, process it
        if (req.file) {
            if (linkType !== 'image' && linkType !== 'file') {
                return res.status(400).json({ message: 'File uploaded but linkType is not "image" or "file".' });
            }
            linkData.content = {
                data: req.file.buffer.toString('base64'),
                contentType: req.file.mimetype,
                filename: req.file.originalname
            };
        }
        
        const link = await linkService.createLink(
            req.user, 
            linkData,
            requestInfo
        );
        
        res.status(201).json(link);
    } catch (error) {
        next(error);
    }
};

const getLinks = async (req, res, next) => {
    try {
        const links = await linkService.getLinksByUser(req.user);
        res.json(links);
    } catch (error) {
        next(error);
    }
};

const updateLink = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { linkType, originalUrl, alias, password, textContent, clearFile } = req.body;
        
        const requestInfo = {
            ip: req.ip,
            userAgent: req.headers['user-agent']
        };

        const updates = {
            linkType,
            originalUrl,
            alias,
            password,
        };

        if (linkType === 'text') {
            updates.content = { text: textContent || '' };
        } else if (clearFile === 'true') {
            updates.content = null;
        }

        // If a new file is uploaded, process it
        if (req.file) {
            if (linkType !== 'image' && linkType !== 'file') {
                 return res.status(400).json({ message: 'File uploaded but linkType is not "image" or "file".' });
            }
            updates.content = {
                data: req.file.buffer.toString('base64'),
                contentType: req.file.mimetype,
                filename: req.file.originalname
            };
        }
        
        const link = await linkService.updateLink(
            req.user, 
            id, 
            updates,
            requestInfo
        );
        
        res.json(link);
    } catch (error) {
        next(error);
    }
};

const deleteLink = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Get request info for audit trail
        const requestInfo = {
            ip: req.ip,
            userAgent: req.headers['user-agent']
        };
        
        const link = await linkService.deleteLink(req.user, id, requestInfo);
        res.json({ message: 'Link successfully deleted', link });
    } catch (error) {
        next(error);
    }
};

const getLinkEditHistory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const history = await linkService.getLinkEditHistory(req.user, id);
        res.json(history);
    } catch (error) {
        next(error);
    }
};

const getLinkById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const link = await linkService.getLinkById(id);

        if (!link || link.userId.toString() !== req.user.id) {
            return res.status(404).json({ message: 'Link not found' });
        }

        res.json(link);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createLink,
    getLinks,
    getLinkById,
    updateLink,
    deleteLink,
    getLinkEditHistory,
    upload // export multer instance
};
