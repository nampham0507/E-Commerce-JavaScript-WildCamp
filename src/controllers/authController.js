const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getLogin = (req, res) => {
    res.render('auth/login', { error: null });
};

exports.getRegister = (req, res) => {
    res.render('auth/register', { error: null });
};

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.render('auth/register', { error: 'Email đã được sử dụng.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Check if this is the first user to make them admin (optional, or we can check email/name)
        // Or simply make them customer by default
        const userCount = await User.countDocuments();
        const role = userCount === 0 ? 'admin' : 'customer';

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role
        });

        await user.save();
        res.redirect('/auth/login');
    } catch (error) {
        res.render('auth/register', { error: 'Có lỗi xảy ra, vui lòng thử lại.' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.render('auth/login', { error: 'Email hoặc mật khẩu không chính xác.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('auth/login', { error: 'Email hoặc mật khẩu không chính xác.' });
        }

        // Set session
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        if (user.role === 'admin') {
            res.redirect('/admin');
        } else {
            res.redirect('/');
        }
    } catch (error) {
        res.render('auth/login', { error: 'Có lỗi xảy ra, vui lòng thử lại.' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
};
