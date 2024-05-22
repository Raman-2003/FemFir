const User = require('../models/userSchema');
const { Category } = require('../models/categorySchema');
const { Product } = require('../models/productSchema');
const userHelper = require('../helpers/user_helper');
const argon2 = require('argon2');
const bcrypt = require('bcrypt');


let otp;
let userotp;
let usermail;
let hashedPassword;
let userRegesterData;
let userData;


// 404 Not Found Page
const pagenotFound = async (req, res) => {
    try {
        res.render("404 page");
    } catch (error) {
        console.log(error.message);
    }
};

// Home page
const getHome = async (req, res) => {
    try {
        if(req.session.user){
            res.render('user/index')
        }
        else{
            res.redirect('/login');
        }
        // const categories = await Category.find({ is_unListed: false }).lean();
        // const products = await Product.find({ is_blocked: false }).lean();
        // res.render('user/index'), { products, categories, userData });
        
    } catch (error) {
        console.log(error.message);
    }
};

const showloginPage = async (req, res) => {
    try {
        if(!req.session.user){
            res.render('user/login');
        }else{
            res.redirect('/');
        }
    } catch (error) {
        console.log(error);
    }
};

// Login Details submission
const doLogin = async (req, res) => {
    try {
        const Email = req.body.email;
        const Password = req.body.password;
        // console.log(Password);
        userData = await User.findOne({ email: Email }).lean();
        // console.log(userData);
        if (userData.is_blocked === true) res.redirect('/login')

            if(userData){
            if (await argon2.verify(userData.password, Password)) {
                req.session.LoggedIn = true;
                req.session.user = userData;
               res.redirect('/');
            }
        }        
    
     else {
            res.redirect('/login');
        }
    } catch (error) {
        console.log(error);
    }
};

// Logout functionality
const doLogout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log('Logout error');
                res.redirect('/');
            }
            console.log('Logged out successfully');
            res.redirect('/login');
        });
        userData = null;
    } catch (error) {
        console.log(error.message);
    }
};

// Render signup page
const showsignupPage = async (req, res) => {
    try {
        if(!req.session.user){
            res.render('user/signup');
        }
        else{
            res.redirect('/')
        }
    } catch (error) {
        console.log(error);
    }
};

// User signup
const dosignup = async (req, res) => {
    try {
        let msg = 'User already exists';
        hashedPassword = await userHelper.hashpassword(req.body.password);
        usermail = req.body.email;
        userRegesterData = req.body;

        const userExist = await User.findOne({ email: usermail }).lean();
        if (!userExist) {
            otp = await userHelper.verifyEmail(usermail);
            res.render('user/otp');
        } else {
            res.render('user/login', { msg });
        }
    } catch (error) {
        console.log(error);
    }
};

// Get otp page
const getotppage = async (req, res) => {
    try {
        if(!req.session.user){
            res.render('user/otp');
        }else{
            res.redirect('/')
        }
    } catch (error) {
        console.log(error);
    }
};

// Verify otp and add user data in our Database
const submitotp = async (req, res) => {
    try {
        userotp = req.body.otp;
        // const hashedPassword = await argon2.hash(req.body.password);
        if (userotp == otp) {
            const user = new User({
                firstname: userRegesterData.firstname,
                lastname: userRegesterData.lastname,
                mobile: userRegesterData.mobileNumber,
                email: userRegesterData.email,
                password: hashedPassword,
                isVerified: true,
                is_blocked: false,
                isAdmin: false
            });

            await user.save();
            res.redirect('/login');
        } else {
            otpErr = 'incorrect otp';
            res.render('user/otp', { otpErr });
        }
    } catch (error) {
        console.log(error);
    }
};

// Resend otp
const resendOtp = async (req, res) => {
    try {
        console.log('Resending OTP..');
        res.redirect('/get_otp');
        otp = await userHelper.verifyEmail(usermail);
    } catch (error) {
        console.log(error);
    }
};

module.exports = {
    showloginPage,
    showsignupPage,
    getotppage,
    dosignup,
    submitotp,
    doLogin,
    doLogout,
    getHome,
    resendOtp,
    pagenotFound
};
