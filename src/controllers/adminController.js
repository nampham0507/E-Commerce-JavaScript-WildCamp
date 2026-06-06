const User = require('../models/User');

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.render('admin/users', { users });
    } catch (error) {
        res.status(500).send('Lỗi máy chủ');
    }
};

exports.addUser = async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            req.flash('error', 'Email đã tồn tại trong hệ thống.');
            return res.redirect('/admin/users');
        }

        const newUser = new User({ name, email, phone: phone, password, role });
        await newUser.save();

        req.flash('success', 'Thêm người dùng thành công!');
        res.redirect('/admin/users');
    } catch (error) {
        req.flash('error', 'Lỗi hệ thống khi thêm người dùng.');
        res.redirect('/admin/users');
    }
};

exports.editUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, role } = req.body;

        const user = await User.findById(id);
        if (!user) {
            req.flash('error', 'Không tìm thấy người dùng.');
            return res.redirect('/admin/users');
        }

        user.name  = name;
        user.email = email;
        user.phone = phone || '';
        user.role  = role;
        await user.save();

        // If the admin edited their own details, refresh the session copy
        if (req.session.user && req.session.user.id === id) {
            req.session.user.name = name;
            req.session.user.email = email;
            req.session.user.role = role;
        }

        req.flash('success', 'Cập nhật người dùng thành công!');
        res.redirect('/admin/users');
    } catch (error) {
        req.flash('error', 'Lỗi hệ thống khi cập nhật người dùng.');
        res.redirect('/admin/users');
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent self deletion
        if (req.session.user && req.session.user.id === id) {
            req.flash('error', 'Bạn không thể tự xóa chính mình.');
            return res.redirect('/admin/users');
        }

        await User.findByIdAndDelete(id);

        req.flash('success', 'Xóa người dùng thành công!');
        res.redirect('/admin/users');
    } catch (error) {
        req.flash('error', 'Lỗi hệ thống khi xóa người dùng.');
        res.redirect('/admin/users');
    }
};
