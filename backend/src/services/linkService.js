const Link = require('../models/Link');
const LinkEdit = require('../models/LinkEdit');
const { customAlphabet } = require('nanoid');
const bcrypt = require('bcryptjs');

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz1234567890', 6);

/**
 * Record a link edit in the history
 * @param {Object} user - User making the edit
 * @param {String} linkId - ID of the link being edited
 * @param {String} editType - Type of edit (create, update, delete, restore)
 * @param {Object} changes - Object containing old and new values
 * @param {Object} requestInfo - Info about the request (IP, user agent)
 */
const recordLinkEdit = async (user, linkId, editType, changes, requestInfo = {}) => {
    // Sanitize content field for logging to avoid storing large data in history
    if (changes.content) {
        const oldValue = changes.content.oldValue;
        const newValue = changes.content.newValue;

        const sanitize = (content) => {
            if (!content) return content;
            // For file/image, just log that there was data, not the data itself.
            if (content.data) {
                return { ...content, data: `[${content.contentType || 'binary data'}]` };
            }
            // For text, truncate if it's too long
            if (content.text && content.text.length > 200) {
                 return { ...content, text: content.text.substring(0, 200) + '...' };
            }
            return content;
        }

        changes.content = {
            oldValue: sanitize(oldValue),
            newValue: sanitize(newValue)
        };
    }

    const linkEdit = new LinkEdit({
        linkId,
        userId: user._id,
        timestamp: new Date(),
        changes,
        ipAddress: requestInfo.ip || null,
        userAgent: requestInfo.userAgent || null,
        editType
    });
    
    await linkEdit.save();
    return linkEdit;
};

const createLink = async (user, linkData, requestInfo = {}) => {
    let finalAlias = linkData.alias;
    // If a custom alias is provided, check for its uniqueness
    if (finalAlias) {
        const aliasExists = await Link.findOne({ alias: finalAlias });
        if (aliasExists) {
            throw new Error('Alias already in use.');
        }
    } else {
        // Generate a unique alias
        finalAlias = nanoid();
        let aliasExists = await Link.findOne({ alias: finalAlias });
        while (aliasExists) {
            finalAlias = nanoid();
            aliasExists = await Link.findOne({ alias: finalAlias });
        }
    }

    const newLinkData = {
        userId: user._id,
        alias: finalAlias,
        linkType: linkData.linkType || 'redirect',
        originalUrl: linkData.originalUrl,
        content: linkData.content,
    };
    
    // Hash password if provided
    if (linkData.password) {
        const salt = await bcrypt.genSalt(10);
        newLinkData.passwordHash = await bcrypt.hash(linkData.password, salt);
    }

    const link = new Link(newLinkData);
    await link.save();
    
    // Record the creation in history
    const changes = {
        alias: { oldValue: null, newValue: finalAlias },
        linkType: { oldValue: null, newValue: newLinkData.linkType },
    };

    if (newLinkData.originalUrl) {
        changes.originalUrl = { oldValue: null, newValue: newLinkData.originalUrl };
    }
    if (newLinkData.content) {
        changes.content = { oldValue: null, newValue: newLinkData.content };
    }
     if (newLinkData.passwordHash) {
        changes.password = { oldValue: null, newValue: '******' };
    }

    await recordLinkEdit(user, link._id, 'create', changes, requestInfo);
    
    return link;
};

const getLinksByUser = async (user) => {
    return await Link.find({ userId: user._id }).sort({ createdAt: -1 });
};

const getLinkById = async (id) => {
    return await Link.findById(id);
};

const updateLink = async (user, linkId, updates, requestInfo = {}) => {
    const link = await Link.findOne({ _id: linkId, userId: user._id });

    if (!link) {
        throw new Error('Link not found or user not authorized.');
    }
    
    // Prepare changes object for history
    const changes = {};

    const updatableFields = ['originalUrl', 'linkType', 'content'];

    updatableFields.forEach(field => {
        if (updates[field] !== undefined && JSON.stringify(updates[field]) !== JSON.stringify(link[field])) {
            changes[field] = {
                oldValue: link[field],
                newValue: updates[field]
            };
            link[field] = updates[field];
        }
    });
    
    // Check for alias update (using editableSlug from controller)
    if(updates.alias !== undefined && updates.alias !== link.alias) {
        const aliasExists = await Link.findOne({ 
            alias: updates.alias,
            _id: { $ne: linkId }
        });
        if (aliasExists) {
            throw new Error('Alias already in use.');
        }
        changes.alias = {
            oldValue: link.alias,
            newValue: updates.alias
        };
        link.alias = updates.alias;
    }

    // Handle password update
    if (updates.password !== undefined) {
        changes.password = {
            oldValue: link.passwordHash ? '******' : null, // Don't log old hash
            newValue: updates.password ? '******' : null,
        };
        
        if (updates.password) {
            // Set new password
            const salt = await bcrypt.genSalt(10);
            link.passwordHash = await bcrypt.hash(updates.password, salt);
        } else {
            // Remove password
            link.passwordHash = null;
        }
    }
    
    // Only record history if there were actual changes
    if (Object.keys(changes).length > 0) {
        await recordLinkEdit(user, linkId, 'update', changes, requestInfo);
        await link.save();
    }
    
    return link;
};

const deleteLink = async (user, linkId, requestInfo = {}) => {
    const link = await Link.findOne({ _id: linkId, userId: user._id });

    if (!link) {
        throw new Error('Link not found or user not authorized.');
    }
    
    // Hard delete
    const deletedLink = await Link.deleteOne({ _id: linkId, userId: user._id });

    if (deletedLink.deletedCount > 0) {
         await recordLinkEdit(user, linkId, 'delete', {
            _id: { oldValue: linkId, newValue: null }
        }, requestInfo);
    }
    
    return { message: 'Link deleted successfully.' };
};

const getLinkEditHistory = async (user, linkId) => {
    const link = await Link.findOne({ _id: linkId, userId: user._id });

    if (!link) {
        throw new Error('Link not found or user not authorized.');
    }
    
    return await LinkEdit.find({ linkId }).sort({ timestamp: -1 });
};

module.exports = {
    createLink,
    getLinksByUser,
    getLinkById,
    updateLink,
    deleteLink,
    getLinkEditHistory
};
