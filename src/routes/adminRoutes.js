const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const upload = require('../config/multer');

// Users
router.get('/users', adminController.getUsers);
router.post('/users', adminController.addUser);
router.post('/users/edit/:id', adminController.editUser);
router.post('/users/delete/:id', adminController.deleteUser);

// Categories
router.get('/categories', categoryController.getCategories);
router.post('/categories', categoryController.addCategory);
router.post('/categories/edit/:id', categoryController.editCategory);
router.post('/categories/delete/:id', categoryController.deleteCategory);

// Products
router.get('/products', productController.getProducts);
router.post('/products', upload.single('imageFile'), productController.addProduct);
router.post('/products/edit/:id', upload.single('imageFile'), productController.editProduct);
router.post('/products/delete/:id', productController.deleteProduct);

module.exports = router;
