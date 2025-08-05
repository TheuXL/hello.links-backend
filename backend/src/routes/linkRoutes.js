const express = require('express');
const router = express.Router();
const { 
    createLink, 
    getLinks, 
    updateLink, 
    deleteLink, 
    getLinkEditHistory,
    getLinkById,
    upload
} = require('../controllers/linkController');
const { protect } = require('../middlewares/authMiddleware');
const { checkPlanLimit } = require('../middlewares/planLimitMiddleware');

// All routes here are protected
router.use(protect);

router.route('/')
    .post(
        checkPlanLimit('createLink'),
        checkPlanLimit('customAlias'),
        checkPlanLimit('passwordProtection'),
        upload.single('contentFile'), 
        createLink
    )
    .get(getLinks);

router.route('/:id')
    .get(getLinkById)
    .patch(
        checkPlanLimit('editLink'),
        checkPlanLimit('customAlias'),
        checkPlanLimit('passwordProtection'),
        upload.single('contentFile'), 
        updateLink
    )
    .delete(deleteLink);

router.route('/:id/history')
    .get(getLinkEditHistory);

module.exports = router;
