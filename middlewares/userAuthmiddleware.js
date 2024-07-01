const User = require('../models/userSchema');

const logedin = async (req, res, next) => {
    try {
        if (!req.session.user) {
            console.log('login checked');
            return res.redirect('/login');
        }
        next();
    } catch (error) {
        console.log(error);
    }
}

const logedout = async (req, res, next) => {
    try {
        if (req.session.user) {
            console.log('logout checked'); 
            return res.redirect('/');
        }
        next();
    } catch (error) {
        console.log(error);
    }
}

const isBlocked = async (req, res, next) => {
    try {
        if (!req.session.user || !req.session.user._id) {
            return res.redirect('/login');
        }
        
        const user = await User.findById(req.session.user._id);
        
        if (user && user.is_blocked) {
            return res.redirect('/logout');
        } else {
            next();
        }
    } catch (error) {
        console.log(error);
    }
};

module.exports = {
    logedin,
    logedout,
    isBlocked
}
