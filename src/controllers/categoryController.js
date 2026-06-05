const Category = require('../models/Category');

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find({}).sort({ createdAt: -1 });
        res.render('admin/categories', { categories, error: null, success: null });
    } catch (err) {
        res.status(500).send('Lỗi máy chủ');
    }
};

exports.addCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const exists = await Category.findOne({ name: name.trim() });
        if (exists) {
            const categories = await Category.find({}).sort({ createdAt: -1 });
            return res.render('admin/categories', { categories, error: 'Danh mục đã tồn tại.', success: null });
        }
        await new Category({ name: name.trim() }).save();
        const categories = await Category.find({}).sort({ createdAt: -1 });
        res.render('admin/categories', { categories, error: null, success: 'Thêm danh mục thành công!' });
    } catch (err) {
        const categories = await Category.find({}).sort({ createdAt: -1 });
        res.render('admin/categories', { categories, error: 'Lỗi hệ thống.', success: null });
    }
};

exports.editCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const exists = await Category.findOne({ name: name.trim(), _id: { $ne: id } });
        if (exists) {
            const categories = await Category.find({}).sort({ createdAt: -1 });
            return res.render('admin/categories', { categories, error: 'Tên danh mục đã tồn tại.', success: null });
        }
        await Category.findByIdAndUpdate(id, { name: name.trim() });
        const categories = await Category.find({}).sort({ createdAt: -1 });
        res.render('admin/categories', { categories, error: null, success: 'Cập nhật danh mục thành công!' });
    } catch (err) {
        const categories = await Category.find({}).sort({ createdAt: -1 });
        res.render('admin/categories', { categories, error: 'Lỗi hệ thống.', success: null });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        const categories = await Category.find({}).sort({ createdAt: -1 });
        res.render('admin/categories', { categories, error: null, success: 'Xóa danh mục thành công!' });
    } catch (err) {
        const categories = await Category.find({}).sort({ createdAt: -1 });
        res.render('admin/categories', { categories, error: 'Lỗi hệ thống.', success: null });
    }
};
