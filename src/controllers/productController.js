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

async function renderProducts(res, extra = {}) {
    const products = await Product.find({}).sort({ createdAt: -1 });
    const categories = await Category.find({}).sort({ name: 1 });
    res.render('admin/products', { products, categories, error: null, success: null, ...extra });
}

exports.getProducts = async (req, res) => {
    try {
        await renderProducts(res);
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
        await renderProducts(res, { success: 'Thêm sản phẩm thành công!' });
    } catch (err) {
        await renderProducts(res, { error: 'Lỗi hệ thống khi thêm sản phẩm.' });
    }
};

exports.editProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, price, description, imageUrl, existingImage } = req.body;

        let image = existingImage || '';

        if (req.file) {
            // New file uploaded — delete old uploaded file if any
            deleteUploadedFile(existingImage);
            image = UPLOAD_PREFIX + req.file.filename;
        } else if (imageUrl && imageUrl.trim()) {
            // New URL provided — delete old uploaded file if any
            deleteUploadedFile(existingImage);
            image = imageUrl.trim();
        }
        // else: keep existingImage as-is, no file saved

        await Product.findByIdAndUpdate(id, { name, category, price: Number(price), description, image });
        await renderProducts(res, { success: 'Cập nhật sản phẩm thành công!' });
    } catch (err) {
        await renderProducts(res, { error: 'Lỗi hệ thống khi cập nhật sản phẩm.' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            deleteUploadedFile(product.image);
            await product.deleteOne();
        }
        await renderProducts(res, { success: 'Xóa sản phẩm thành công!' });
    } catch (err) {
        await renderProducts(res, { error: 'Lỗi hệ thống khi xóa sản phẩm.' });
    }
};
