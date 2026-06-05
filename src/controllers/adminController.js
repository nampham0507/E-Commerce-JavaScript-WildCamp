const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get all users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.render('admin/users', { users, error: null, success: null });
    } catch (error) {
        res.status(500).send('Lỗi máy chủ');
    }
};

// Add new user
exports.addUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        const userExists = await User.findOne({ email });
        if (userExists) {
            const users = await User.find({});
            return res.render('admin/users', { users, error: 'Email đã tồn tại trong hệ thống.', success: null });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role
        });

        await newUser.save();
        
        const users = await User.find({});
        res.render('admin/users', { users, error: null, success: 'Thêm người dùng thành công!' });
    } catch (error) {
        const users = await User.find({});
        res.render('admin/users', { users, error: 'Lỗi hệ thống khi thêm người dùng.', success: null });
    }
};

// Edit user (update role, name, email)
exports.editUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, password } = req.body;

        const updateData = { name, email, role };

        // If password is provided, hash it
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        await User.findByIdAndUpdate(id, updateData);

        // If the admin edited their own role/details, update their session
        if (req.session.user && req.session.user.id === id) {
            req.session.user.name = name;
            req.session.user.email = email;
            req.session.user.role = role;
        }

        const users = await User.find({});
        res.render('admin/users', { users, error: null, success: 'Cập nhật người dùng thành công!' });
    } catch (error) {
        const users = await User.find({});
        res.render('admin/users', { users, error: 'Lỗi hệ thống khi cập nhật người dùng.', success: null });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent self deletion
        if (req.session.user && req.session.user.id === id) {
            const users = await User.find({});
            return res.render('admin/users', { users, error: 'Bạn không thể tự xóa chính mình.', success: null });
        }

        await User.findByIdAndDelete(id);

        const users = await User.find({});
        res.render('admin/users', { users, error: null, success: 'Xóa người dùng thành công!' });
    } catch (error) {
        const users = await User.find({});
        res.render('admin/users', { users, error: 'Lỗi hệ thống khi xóa người dùng.', success: null });
    }
};
