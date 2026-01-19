const express = require('express');
const router = express.Router();
const { createUser, getUsers } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', protect, adminOnly, createUser);
router.get('/', protect, adminOnly, getUsers);

module.exports = router;