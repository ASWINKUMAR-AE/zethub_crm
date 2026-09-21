const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { getProjectMilestones, createMilestone, submitMilestoneWork, approveMilestone } = require('../controllers/milestoneController');
const router = express.Router();

router.get('/project/:projectId', protect, getProjectMilestones);
router.post('/', protect, authorize('admin'), createMilestone);
// File upload is handled here, assuming fieldname is 'workFile'
router.put('/:id/submit', protect, authorize('admin', 'team'), upload.single('workFile'), submitMilestoneWork);
router.put('/:id/approve', protect, authorize('admin', 'client'), approveMilestone);

module.exports = router;
