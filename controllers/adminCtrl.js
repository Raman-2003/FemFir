const Admin = require('../models/adminSchema');
const argon2 = require('argon2');
const User = require('../models/userSchema');
const Coupon = require('../models/couponSchema');
const moment = require('moment');


let adminmail; 
let hashedPassword;
let adminRegesterData;
let adminData; 

// dashboard page
const adminHome = async (req, res) => {
    try {
    const locals = {title: 'Admin Home page'};
    if (req.session.admin) {
    res.render('admin/dashboard', {title: locals.title, layout: 'adminLayout', admin: req.session.admin});
    } else {
    res.redirect('/admin/adminlogin');
    }
    } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
    }
}; 
    

// show login
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

// login details submission
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

// logout functionality
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

// render signup page
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

// admin signup
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


//user management get all users informations 
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


//block a user
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

//unblock a user
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
 

 // Load all coupons
 const loadCoupon = async (req, res) => {
    try {
        const coupons = await Coupon.find();

        const couponData = coupons.map((cpn) => ({
            ...cpn.toObject(), // Convert to plain JS object
            expiryDate: moment(cpn.expiryDate).format("MMMM D, YYYY"),
            createdDate: moment(cpn.createdDate).format("MMMM D, YYYY")
        }));

        res.render("admin/coupon", { couponData, layout: 'adminLayout' });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error loading coupons');
    }
};

 
 // Render add coupon page
 const addCoupon = (req, res) => {
     try {
         const message = req.session.message;
         req.session.message = null; // Clear the session message
 
         res.render("admin/add_coupon", { message, layout: 'adminLayout' });
     } catch (error) {
         console.log(error);
         res.status(500).send('Error rendering add coupon page');
     }
 };
 
 const addCouponPost = async (req, res) => {
    try {
        const { code, percent, expDate, maxPrice, description } = req.body; 

        const cpnExist = await Coupon.findOne({ code: code });

        if (!cpnExist) {
            const coupon = new Coupon({
                code,
                discount: percent,
                expiryDate: expDate,
                maxPrice: maxPrice,
                description 
            });

            await coupon.save();
            req.session.message = "Coupon added successfully!";
        } else {
            req.session.message = "Coupon already exists!";
        }

        res.redirect("/admin/add_coupon");
    } catch (error) {
        console.log(error);
        res.status(500).send('Error adding coupon');
    }
};

 
 // Handle delete coupon
 const deleteCoupon = async (req, res) => {
     try {
         const id = req.query.id;
 
         await Coupon.findByIdAndDelete(id);
 
         res.redirect("/admin/coupons");
     } catch (error) {
         console.log(error);
         res.status(500).send('Error deleting coupon');
     }
 };
 
 // Render edit coupon page
 const editCoupon = async (req, res) => {
     try {
         const id = req.query.id;
         const coupon = await Coupon.findById(id);
 
         if (coupon) {
             res.render("admin/edit_coupon", { coupon, layout: 'adminLayout' });
         } else {
             res.redirect("/admin/coupons");
         }
     } catch (error) {
         console.log(error);
         res.status(500).send('Error loading edit coupon page');
     }
 };
 
 // Handle edit coupon form submission
 const editCouponPost = async (req, res) => {
    try {
        const { id, code, percent, expDate, maxPrice, description } = req.body; 

        await Coupon.findByIdAndUpdate(id, {
            code,
            discount: percent,
            expiryDate: expDate,
            maxPrice: maxPrice,
            description 
        });

        res.redirect("/admin/coupons");
    } catch (error) {
        console.log(error);
        res.status(500).send('Error editing coupon');
    }
};

 
 // Toggle coupon status
 const toggleStatusCoupon = async (req, res) => {
     try {
         const { id, status } = req.query;
         await Coupon.findByIdAndUpdate(id, { status: status === 'true' });
 
         res.redirect("/admin/coupons");
     } catch (error) {
         console.log(error);
         res.status(500).send('Error toggling coupon status');
     }
 };
 


module.exports = {
    adminLogin,
    adminSignup,
    doadminsignup,
    doadminLogin,
    doadminLogout,
    adminHome,
    getAllUsers,
    blockUser,
    unblockUser,
    loadCoupon,
    addCoupon,
    addCouponPost,
    deleteCoupon,
    editCoupon,
    editCouponPost,
    toggleStatusCoupon
};
