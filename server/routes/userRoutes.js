const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const { getUsers, createUser } = require('../controllers/userController');
const router = express.Router();

router.get('/', protect, authorize('admin'), getUsers);
router.post('/', protect, authorize('admin'), createUser);

module.exports = router;
