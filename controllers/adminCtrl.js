const Admin = require('../models/adminSchema');
const argon2 = require('argon2');
const User = require('../models/userSchema');

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

const getAllUsers = async(req,res) => {
    try{    
    if(req.session.admin){
            const allUsers = await User.find();
            res.render('admin/userManagement', {
                layout: 'adminLayout',
                title: "User Management page",
                users: allUsers
            });
            
        }else{
            res.redirect('/admin/adminlogin')
        }
     }
    catch(error){
            console.log('Some Error '+error);
            res.redirect('/admin/');
       }
 }

 const blockUser = async (req,res)=>{
    try{
        const userId = req.params.id;
        await User.findByIdAndUpdate(userId, {is_blocked:true});
        res.redirect('/admin/userm');
        
    }catch(error){
        console.log('Error blocking user: ', error);
        res.redirect('/admin/userm')
    }
 }

 const unblockUser = async (req,res) => {
    try{
        const userId = req.params.id;
        await User.findByIdAndUpdate(userId, {is_blocked: false});
        res.redirect('/admin/userm')
    }
    catch(error){
        console.error('Error unblocking user: ', error);
        res.redirect('/admin/userm');
    }
 }

module.exports = {
    adminLogin,
    adminSignup,
    doadminsignup,
    doadminLogin,
    doadminLogout,
    adminHome,
    getAllUsers,
    blockUser,
    unblockUser
};
