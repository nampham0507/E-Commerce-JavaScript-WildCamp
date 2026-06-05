const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/users', adminController.getUsers);
router.post('/users', adminController.addUser);
router.post('/users/edit/:id', adminController.editUser);
router.post('/users/delete/:id', adminController.deleteUser);

module.exports = router;
