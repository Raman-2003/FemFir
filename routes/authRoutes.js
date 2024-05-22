const express = require('express');

const router = express.Router();

// const { logedin, logedout, isBlocked} = require('../middlewares/userAuthmiddleware');

const {
    getHome,
    showloginPage,
    doLogin,
    doLogout,
    showsignupPage,
    dosignup,
    getotppage,
    submitotp,
    resendOtp,
    pagenotFound

} = require('../controllers/userCtrl');
 
//Error page
router.get('/error_page',pagenotFound);

//User controlls
router.get('/', getHome);
router.get('/login', showloginPage);
router.post('/login', doLogin);


router.get('/signup', showsignupPage)
router.post('/signup', dosignup)

router.get('/get_otp', getotppage);
router.post('/submit_otp', submitotp)
router.get('/resend_otp', resendOtp);

router.get('/logout', doLogout);

router.get('/product', (req,res)=>res.render('user/product'))
router.get('/producttwo', (req,res)=>res.render('user/producttwo'))
router.get('/productthree', (req,res)=>res.render('user/productthree'))
router.get('/viewone', (req,res)=>res.render('user/view'))

module.exports = router;

