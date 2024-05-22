const Admin = require('../models/adminSchema');
const argon2 = require('argon2');

let adminmail;
let hashedPassword;
let adminRegesterData;
let adminData;

// Home page
const adminHome = async (req, res) => {
    try {
        const locals = {title: 'Admin Home page'};
        if (req.session.admin) {
            res.render('admin/dashboard', {title: locals.title, layout: 'adminLayout'});
        } else {
            res.redirect('/admin/adminlogin');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

// Show login
const adminLogin = async (req, res) => {
    try {
        const locals = {title: 'Admin Login'};
        if (!req.session.admin) {
            res.render('admin/login', {title: locals.title, layout: 'adminLayout'});
        } else {
            res.redirect('/admin');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

// Login details submission
const doadminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        adminData = await Admin.findOne({ email }).lean();

        if (adminData && await argon2.verify(adminData.password, password)) {
            req.session.LoggedIn = true;
            req.session.admin = adminData;
            res.redirect('/admin'); // Redirect to the admin home page
        } else {
            res.redirect('/admin/adminlogin');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

// Logout functionality
const doadminLogout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log('Logout error:', err);
                return res.status(500).send('Internal Server Error');
            }
            console.log('Logged out successfully');
            res.redirect('/admin/adminlogin'); // Redirect to the login page
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

// Render signup page
const adminSignup = async (req, res) => {
    try {
        const locals = {title: 'Admin Signup'};
        if (!req.session.admin) {
            res.render('admin/signup', {title: locals.title, layout: 'adminLayout'});
        } else {
            res.redirect('/admin');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

// Admin signup
const doadminsignup = async (req, res) => {
    try {
        const locals = {title: 'Admin Signup'};
        let msg = 'Admin already exists';
        hashedPassword = await argon2.hash(req.body.password);
        adminmail = req.body.email;
        adminRegesterData = req.body;

        const adminExist = await Admin.findOne({ email: adminmail }).lean();
        if (!adminExist) {
            const admin = new Admin({
                firstname: adminRegesterData.firstname,
                lastname: adminRegesterData.lastname,
                mobile: adminRegesterData.mobileNumber,
                email: adminRegesterData.email,
                password: hashedPassword,
                isAdmin: true
            });
            await admin.save();
            res.redirect('/admin/adminlogin'); // Redirect to the login page after successful signup
        } else {
            res.render('admin/signup', {title: locals.title, msg, layout: 'adminLayout'});
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    adminLogin,
    adminSignup,
    doadminsignup,
    doadminLogin,
    doadminLogout,
    adminHome,
};
