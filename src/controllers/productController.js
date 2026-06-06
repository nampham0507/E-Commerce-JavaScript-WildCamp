const Product = require('../models/Product');
const Category = require('../models/Category');
const path = require('path');
const fs = require('fs');

const UPLOAD_PREFIX = '/assets/img/uploads/';

function isUploadedImage(imagePath) {
    return imagePath && imagePath.startsWith(UPLOAD_PREFIX);
}

function deleteUploadedFile(imagePath) {
    if (!isUploadedImage(imagePath)) return;
    const filePath = path.join(__dirname, '../views/public', imagePath);
    fs.unlink(filePath, () => {});
}

exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find({}).sort({ createdAt: -1 });
        const categories = await Category.find({}).sort({ name: 1 });
        res.render('admin/products', { products, categories });
    } catch (err) {
        res.status(500).send('Lỗi máy chủ');
    }
};

exports.addProduct = async (req, res) => {
    try {
        const { name, category, price, description, imageUrl } = req.body;
        let image = '';

        if (req.file) {
            image = UPLOAD_PREFIX + req.file.filename;
        } else if (imageUrl && imageUrl.trim()) {
            image = imageUrl.trim();
        }

        await new Product({ name, category, price: Number(price), description, image }).save();
        req.flash('success', 'Thêm sản phẩm thành công!');
        res.redirect('/admin/products');
    } catch (err) {
        req.flash('error', 'Lỗi hệ thống khi thêm sản phẩm.');
        res.redirect('/admin/products');
    }
};

exports.editProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, price, description, imageUrl, existingImage } = req.body;

        let image = existingImage || '';

        if (req.file) {
            deleteUploadedFile(existingImage);
            image = UPLOAD_PREFIX + req.file.filename;
        } else if (imageUrl && imageUrl.trim()) {
            deleteUploadedFile(existingImage);
            image = imageUrl.trim();
        }

        await Product.findByIdAndUpdate(id, { name, category, price: Number(price), description, image });
        req.flash('success', 'Cập nhật sản phẩm thành công!');
        res.redirect('/admin/products');
    } catch (err) {
        req.flash('error', 'Lỗi hệ thống khi cập nhật sản phẩm.');
        res.redirect('/admin/products');
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            deleteUploadedFile(product.image);
            await product.deleteOne();
        }
        req.flash('success', 'Xóa sản phẩm thành công!');
        res.redirect('/admin/products');
    } catch (err) {
        req.flash('error', 'Lỗi hệ thống khi xóa sản phẩm.');
        res.redirect('/admin/products');
    }
};
