const User = require('../models/User');

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

exports.getLogin = (req, res) => {
    res.render('auth/login');
};

exports.getRegister = (req, res) => {
    res.render('auth/register');
};

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            req.flash('error', 'Email đã được sử dụng.');
            return res.redirect('/auth/register');
        }

        // First registered user becomes admin, the rest are customers
        const userCount = await User.countDocuments();
        const role = userCount === 0 ? 'admin' : 'customer';

        // Password is hashed automatically by the pre-save hook in the User model
        const user = new User({ name, email, password, role });
        await user.save();

        req.flash('success', 'Đăng ký thành công! Vui lòng đăng nhập.');
        res.redirect('/auth/login');
    } catch (error) {
        req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại.');
        res.redirect('/auth/register');
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password, remember } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error', 'Email hoặc mật khẩu không chính xác.');
            return res.redirect('/auth/login');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            req.flash('error', 'Email hoặc mật khẩu không chính xác.');
            return res.redirect('/auth/login');
        }

        // "Remember me": keep the session for 7 days; otherwise it expires when the browser closes
        if (remember) {
            req.session.cookie.maxAge = SEVEN_DAYS;
        } else {
            req.session.cookie.expires = false; // session cookie
        }

        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        const returnTo = req.session.returnTo || (user.role === 'admin' ? '/admin' : '/');
        delete req.session.returnTo;
        res.redirect(returnTo);
    } catch (error) {
        req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại.');
        res.redirect('/auth/login');
    }
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
};
