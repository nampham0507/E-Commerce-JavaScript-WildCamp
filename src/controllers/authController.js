const User = require('../models/User');

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

exports.getLogin = (req, res) => {
    res.render('auth/login', { error: null });
};

exports.getRegister = (req, res) => {
    res.render('auth/register', { error: null });
};

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.render('auth/register', { error: 'Email đã được sử dụng.' });
        }

        // First registered user becomes admin, the rest are customers
        const userCount = await User.countDocuments();
        const role = userCount === 0 ? 'admin' : 'customer';

        // Password is hashed automatically by the pre-save hook in the User model
        const user = new User({ name, email, password, role });
        await user.save();

        res.redirect('/auth/login');
    } catch (error) {
        res.render('auth/register', { error: 'Có lỗi xảy ra, vui lòng thử lại.' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password, remember } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.render('auth/login', { error: 'Email hoặc mật khẩu không chính xác.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('auth/login', { error: 'Email hoặc mật khẩu không chính xác.' });
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
        res.render('auth/login', { error: 'Có lỗi xảy ra, vui lòng thử lại.' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
};
