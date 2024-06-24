const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const Product = require('../models/productSchema')

const {
    getHome, showloginPage, doLogin, doLogout, showsignupPage, dosignup, getotppage, 
    submitotp, resendOtp,getAdditionalInfoPage, saveAdditionalInfo, getProducts, 
    getProductDetails } = require('../controllers/userCtrl');

const { logedout, logedin, isBlocked } = require('../middlewares/userAuthmiddleware');

const { showWishlistPage,addToWishList,removeFromWishList,addToCartFromWishlist } = require('../controllers/wishlist');

const profileController = require('../controllers/profile');

const cartController = require('../controllers/cart');

const {
    getCheckoutPage, placeOrder, getOrderDetailsPage, cancelOrder, returnOrder, 
    getCartCheckoutPage, getInvoice, setDefaultAddress, loadUserCoupons, applyCoupon, removeCoupon
} = require('../controllers/checkout');

const paymentCtrl = require('../controllers/paymentCtrl')
 
//user controls
router.get('/', logedin, isBlocked, getHome); 
router.get('/login', logedout, showloginPage);
router.post('/login', logedout, doLogin);   

router.get('/signup', logedout, showsignupPage); 
router.post('/signup', logedout, dosignup); 

router.get('/get_otp', logedout, getotppage); 
router.post('/submit_otp', logedout, submitotp); 
router.get('/resend_otp', logedout, resendOtp); 
router.get('/logout', logedin, doLogout); 

//google authentication
router.get('/auth/google', logedout, passport.authenticate('google', { scope: ['profile', 'email'] })); 
router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    async (req, res) => {
        if (!req.user.mobile || !req.user.password) {
            req.session.user = req.user;
            return res.redirect('/auth/google/additional-info');
        }
        req.session.user = req.user;
        res.redirect('/');
    }
);

router.get('/auth/google/additional-info', logedin, getAdditionalInfoPage); 
router.post('/auth/google/additional-info', logedin, saveAdditionalInfo); 

//products
router.get('/product', logedin, isBlocked, getProducts); 
router.get(['/viewone/:id', '/product/:id'], logedin, isBlocked, getProductDetails);

// Wishlist routes
router.get('/wishlist', logedin, isBlocked, showWishlistPage);
router.post('/wishlist/add', logedin, isBlocked, addToWishList);
router.post('/wishlist/remove-from-wishlist', logedin, isBlocked, removeFromWishList);
router.post('/wishlist/add-to-cart',logedin, isBlocked, addToCartFromWishlist);

// Profile routes
router.get('/profile', logedin, isBlocked, profileController.loadProfile); 

// Address section
router.get('/edit-details', logedin, isBlocked, profileController.editDetails); 
router.post('/edit-details/:id', logedin, isBlocked, profileController.updateDetails); 
router.get('/add-new-address', logedin, isBlocked, profileController.addNewAddress); 
router.post('/add-new-address', logedin, isBlocked, profileController.addNewAddressPost);
router.post('/delete-address/:id', profileController.deleteAddress); 

// Edit address routes
router.get('/edit-address/:id', logedin, isBlocked, profileController.editAddress);
router.post('/edit-address/:id', logedin, isBlocked, profileController.editAddressPost);
router.get('/view-order/:id', profileController.viewOrder);

// Cancel order route
router.post('/cancel-order/:id', profileController.cancelOrder);
router.post('/profile/change-password', profileController.changePassword);
router.get('/return-order/:id', profileController.returnOrderForm);
router.post('/return-order/:id', profileController.processReturnOrder);
router.post('/cancel-return/:id', profileController.cancelReturnOrder);


// Cart
router.get('/cart', logedin, isBlocked, cartController.loadCart);
router.post('/cart/add-to-cart', logedin, isBlocked, cartController.addToCart);
router.get('/cart/remove', logedin, isBlocked, cartController.removeCart);
router.post('/cart_updation', logedin, isBlocked, cartController.updateCart);
router.post('/cart/update', logedin, isBlocked, cartController.updateCartQuantity);

// Checkout_coupon routes
router.get('/coupons_list', logedin, isBlocked, loadUserCoupons);
router.get('/apply_coupon', logedin, isBlocked, applyCoupon);
router.post('/checkout/apply-coupon', logedin, isBlocked, applyCoupon);
router.post('/checkout/remove-coupon',logedin, isBlocked, removeCoupon);

// Checkout routes
router.get('/checkout', logedin, isBlocked, cartController.getCheckoutPage);
router.post('/checkout/placeOrder', logedin, isBlocked, placeOrder); 
router.get('/checkout/cartCheckout', logedin, isBlocked, getCartCheckoutPage); 

// Order routes
router.get('/order/:id', logedin, isBlocked, getOrderDetailsPage);
router.post('/order/:id/return', logedin, isBlocked, returnOrder); 
router.get('/order/:id/invoice', logedin, isBlocked, getInvoice); 

// Address routes
router.post('/address/:id/setDefault', logedin, isBlocked, setDefaultAddress); 

// wallet Routes
router.get('/wallet', paymentCtrl.getWallet);
router.get('/wallet/add-money', paymentCtrl.addMoneyForm);
router.post('/add-money', paymentCtrl.initiatePayment);
router.post('/verify-payment', paymentCtrl.verifyPayment);
router.post('/initiate-payment', paymentCtrl.initiatePayment);

module.exports = router;
