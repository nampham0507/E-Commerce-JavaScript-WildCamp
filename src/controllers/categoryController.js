const Category = require('../models/Category');

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find({}).sort({ createdAt: -1 });
        res.render('admin/categories', { categories });
    } catch (err) {
        res.status(500).send('Lỗi máy chủ');
    }
};

exports.addCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const exists = await Category.findOne({ name: name.trim() });
        if (exists) {
            req.flash('error', 'Danh mục đã tồn tại.');
            return res.redirect('/admin/categories');
        }
        await new Category({ name: name.trim() }).save();
        req.flash('success', 'Thêm danh mục thành công!');
        res.redirect('/admin/categories');
    } catch (err) {
        req.flash('error', 'Lỗi hệ thống.');
        res.redirect('/admin/categories');
    }
};

exports.editCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const exists = await Category.findOne({ name: name.trim(), _id: { $ne: id } });
        if (exists) {
            req.flash('error', 'Tên danh mục đã tồn tại.');
            return res.redirect('/admin/categories');
        }
        await Category.findByIdAndUpdate(id, { name: name.trim() });
        req.flash('success', 'Cập nhật danh mục thành công!');
        res.redirect('/admin/categories');
    } catch (err) {
        req.flash('error', 'Lỗi hệ thống.');
        res.redirect('/admin/categories');
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        req.flash('success', 'Xóa danh mục thành công!');
        res.redirect('/admin/categories');
    } catch (err) {
        req.flash('error', 'Lỗi hệ thống.');
        res.redirect('/admin/categories');
    }
};
