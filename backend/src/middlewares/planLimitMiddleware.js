const Link = require('../models/Link');
const LinkEdit = require('../models/LinkEdit');
const plans = require('../config/plans');

const checkPlanLimit = (limitType) => async (req, res, next) => {
        try {
        const user = req.user;
            if (!user) {
            return res.status(401).json({ message: 'User not found' });
            }

        const plan = plans[user.plan];
        if (!plan) {
            return res.status(403).json({ message: 'Invalid plan configuration' });
            }

        const limits = {
            createLink: {
                count: async () => Link.countDocuments({ userId: user._id }),
                limit: plan.limits.links,
                message: 'You have reached the maximum number of links for your plan.'
            },
            editLink: {
                count: async () => LinkEdit.countDocuments({ userId: user._id, editType: 'update' }),
                limit: plan.limits.edits,
                message: 'You have reached the maximum number of edits for your plan.'
            },
            generateQRCode: {
                count: async () => Link.countDocuments({ userId: user._id, qrCodeGeneratedAt: { $exists: true } }),
                limit: plan.limits.qrcodes,
                message: 'You have reached the maximum number of QR codes for your plan.'
            }
        };

        // Check for quantitative limits
        if (limits[limitType]) {
            const { count, limit, message } = limits[limitType];
            const currentCount = await count();
            
            if (currentCount >= limit) {
                        return res.status(403).json({ 
                    message,
                    upgradeRequired: true 
                        });
                    }
        }
        // Check for feature flags (This part is simplified as most checks are now quantitative or handled by frontend UI)
        else if (!plan.features.includes(limitType)) {
                        return res.status(403).json({
                message: `The feature '${limitType}' is not available on the '${user.plan}' plan.`,
                upgradeRequired: true
            });
            }

            next();
        } catch (error) {
        console.error('Error in planLimitMiddleware:', error);
        res.status(500).json({ message: 'Internal server error while checking plan limits.' });
        }
};

module.exports = { checkPlanLimit }; 