const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser } = require('../controllers/userController');
const { protect, allowRoles } = require('../middleware/authMiddleware');

router.use(protect, allowRoles('admin'));
router.get('/', getUsers);
router.post('/', createUser);
router.patch('/:id', updateUser);

module.exports = router;
