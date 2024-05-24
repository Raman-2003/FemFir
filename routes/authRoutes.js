const express = require('express');

const router = express.Router();
const passport = require('../config/passport')
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
    pagenotFound,
    getAdditionalInfoPage,
    saveAdditionalInfo

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


router.get('/auth/google',passport.authenticate('google', {scope: ['profile', 'email']}));
router.get('/auth/google/callback',
    passport.authenticate('google', {failureRedirect: '/login'}),
    async (req,res)=>{
        if(!req.user.mobile || !req.user.password){
            req.session.user = req.user;
            return res.redirect('/auth/google/additional-info');
        }
        req.session.user = req.user;
        res.redirect('/')
    }
)

router.get('/auth/google/additional-info', getAdditionalInfoPage);
router.post('/auth/google/additional-info', saveAdditionalInfo);



router.get('/product', (req,res)=>res.render('user/product'))
router.get('/producttwo', (req,res)=>res.render('user/producttwo'))
router.get('/productthree', (req,res)=>res.render('user/productthree'))
router.get('/viewone', (req,res)=>res.render('user/view'))

module.exports = router;

