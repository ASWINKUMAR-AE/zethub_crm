const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const { getProjects, getProjectById, createProject, completeProject } = require('../controllers/projectController');
const router = express.Router();

router.get('/', protect, getProjects);
router.get('/:id', protect, getProjectById);
router.post('/', protect, authorize('admin'), createProject);
router.post('/create', protect, authorize('admin'), createProject);
router.put('/:id/complete', protect, authorize('admin'), completeProject);

module.exports = router;

