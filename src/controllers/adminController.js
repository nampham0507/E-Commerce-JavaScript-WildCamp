const User = require('../models/User');

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

        // Password is hashed automatically by the pre-save hook in the User model
        const newUser = new User({ name, email, password, role });
        await newUser.save();

        const users = await User.find({});
        res.render('admin/users', { users, error: null, success: 'Thêm người dùng thành công!' });
    } catch (error) {
        const users = await User.find({});
        res.render('admin/users', { users, error: 'Lỗi hệ thống khi thêm người dùng.', success: null });
    }
};

// Edit user (update name, email, role and optionally password)
exports.editUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, password } = req.body;

        const user = await User.findById(id);
        if (!user) {
            const users = await User.find({});
            return res.render('admin/users', { users, error: 'Không tìm thấy người dùng.', success: null });
        }

        user.name = name;
        user.email = email;
        user.role = role;

        // Only update password when a new one is provided.
        // Assigning it marks the field as modified so the pre-save hook hashes it.
        if (password && password.trim() !== '') {
            user.password = password.trim();
        }

        await user.save();

        // If the admin edited their own details, refresh the session copy
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
