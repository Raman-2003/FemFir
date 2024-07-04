const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const Product = require('../models/productSchema')
const User = require('../models/userSchema');
const Order = require('../models/orderSchema');
const PDFDocument = require('pdfkit-table');
const moment = require('moment');

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
    getCartCheckoutPage, setDefaultAddress, loadUserCoupons, applyCoupon, removeCoupon
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

router.get('/order/:id/invoice', async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId)
            .populate('userId')
            .populate('items.product')
            .populate('billingAddress')
            .populate('shippingAddress');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Create a new PDF document with A3 size
        const doc = new PDFDocument({ size: 'A3', margin: 50 });

        // Set the response headers for PDF download
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${orderId}.pdf`);
        res.setHeader('Content-Type', 'application/pdf');

        // Pipe the PDF into the response
        doc.pipe(res);

        // Invoice Title and Date
        doc.fontSize(20).text('Invoice', { align: 'center' });
        doc.fontSize(12).text(`Order Date: ${moment(order.createdAt).format('YYYY-MM-DD')}`, { align: 'center' });
        doc.moveDown(2);

        // Center alignment helper function
        const calculateX = (width) => (doc.page.width - width) / 2;

        // Prepare User Details as Table Data
        const userDetailsTable = {
            headers: [{ label: 'Field', property: 'field', width: 150 }, { label: 'Details', property: 'details', width: 400 }],
            datas: [
                { field: 'Customer Name', details: `${order.userId.firstname} ${order.userId.lastname}` },
                { field: 'Email', details: order.userId.email }
            ],
            options: {
                columnSpacing: 5,
                padding: 5,
                x: calculateX(550), // Center align
                width: 550, // Total width of the table
                prepareHeader: () => doc.font('Helvetica-Bold').fontSize(12), // Styling headers
                prepareRow: (row, i) => doc.font('Helvetica').fontSize(10) // Styling rows
            }
        };

        // Draw User Details Table
        await doc.table(userDetailsTable);
        doc.moveDown(2);

        // Prepare Address Details as Table Data
        const shippingAddress = order.shippingAddress ? `${order.shippingAddress.name}, ${order.shippingAddress.addressLine1}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.pin}` : 'No shipping address provided';
        const billingAddress = order.billingAddress ? `${order.billingAddress.name}, ${order.billingAddress.addressLine1}, ${order.billingAddress.city}, ${order.billingAddress.state}, ${order.billingAddress.pin}` : 'No billing address provided';

        const addressDetailsTable = {
            headers: [{ label: 'Field', property: 'field', width: 150 }, { label: 'Details', property: 'details', width: 400 }],
            datas: [
                { field: 'Shipping Address', details: shippingAddress },
                { field: 'Billing Address', details: billingAddress }
            ],
            options: {
                columnSpacing: 5,
                padding: 5,
                x: calculateX(550), // Center align
                width: 550, // Total width of the table
                prepareHeader: () => doc.font('Helvetica-Bold').fontSize(12), // Styling headers
                prepareRow: (row, i) => doc.font('Helvetica').fontSize(10) // Styling rows
            }
        };

        // Draw Address Details Table
        await doc.table(addressDetailsTable);
        doc.moveDown(2);

        // Prepare Order Items as Table Data
        const orderItemsTable = {
            headers: [
                { label: 'Product Name', property: 'productName', width: 200 },
                { label: 'Quantity', property: 'quantity', width: 100, align: 'center' },
                { label: 'Unit Price (₹)', property: 'unitPrice', width: 100, align: 'center' },
                { label: 'Total Price (₹)', property: 'totalPrice', width: 100, align: 'center' }
            ],
            datas: order.items.map(item => ({
                productName: item.product.name,
                quantity: item.quantity,
                unitPrice: `₹${item.product.price.toFixed(2)}`,
                totalPrice: `₹${item.total.toFixed(2)}`
            })),
            options: {
                columnSpacing: 5,
                padding: 5,
                x: calculateX(500), // Center align
                width: 500, // Total width of the table
                prepareHeader: () => doc.font('Helvetica-Bold').fontSize(12), // Styling headers
                prepareRow: (row, i) => doc.font('Helvetica').fontSize(10) // Styling rows
            }
        };

        // Draw Order Items Table
        await doc.table(orderItemsTable);
        doc.moveDown(2);

        // Prepare Order Summary as Table Data
        const orderDetailsTable = {
            headers: [{ label: 'Field', property: 'field', width: 150 }, { label: 'Details', property: 'details', width: 400 }],
            datas: [
                { field: 'Total Amount', details: `₹${order.totalAmount.toFixed(2)}` },
                { field: 'Payment Method', details: order.paymentMethod },
                { field: 'Status', details: order.status }
            ],
            options: {
                columnSpacing: 5,
                padding: 5,
                x: calculateX(550), // Center align
                width: 550, // Total width of the table
                prepareHeader: () => doc.font('Helvetica-Bold').fontSize(12), // Styling headers
                prepareRow: (row, i) => doc.font('Helvetica').fontSize(10) // Styling rows
            }
        };

        // Draw Order Summary Table
        await doc.table(orderDetailsTable);

        // Finalize the PDF and end the stream
        doc.end();
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});



// Function to draw a table
function drawTable(doc, headers, rows) {
    const tableTop = doc.y;
    const columnWidth = (doc.page.width - doc.options.margins.left - doc.options.margins.right) / headers.length;
    const rowHeight = 30;
    let currentX = doc.x;
    let currentY = tableTop;

    // Draw Headers
    headers.forEach(header => {
        doc.rect(currentX, currentY, columnWidth, rowHeight).stroke();
        doc.font('Helvetica-Bold').fontSize(12).text(header, currentX + 5, currentY + 7, { width: columnWidth, align: 'center' });
        currentX += columnWidth;
    });

    // Draw Rows
    currentY += rowHeight;
    rows.forEach(row => {
        currentX = doc.x;
        row.forEach(cell => {
            doc.rect(currentX, currentY, columnWidth, rowHeight).stroke();
            doc.font('Helvetica').fontSize(12).text(cell, currentX + 5, currentY + 7, { width: columnWidth, align: 'center' });
            currentX += columnWidth;
        });
        currentY += rowHeight;
    });
}


// Function to draw table
function drawTable(doc, headers, rows) {
    const tableTop = doc.y;
    const itemSpacing = 30;
    let startX = doc.x;

    // Draw Header
    headers.forEach(header => {
        doc.font('Helvetica-Bold').fontSize(12).text(header, startX, tableTop, { width: 200, align: 'center' });
        startX += 200;
    });

    doc.moveDown();

    // Draw Rows
    let currentY = tableTop + itemSpacing;
    rows.forEach(row => {
        startX = doc.x;
        row.forEach((cell, i) => {
            doc.font('Helvetica').fontSize(12).text(cell, startX, currentY, { width: 200, align: 'center' });
            startX += 200;
        });
        currentY += itemSpacing;
        doc.moveDown();
    });
}



// Address routes
router.post('/address/:id/setDefault', logedin, isBlocked, setDefaultAddress); 

// wallet Routes
router.get('/wallet', paymentCtrl.getWallet);
router.get('/wallet/add-money', paymentCtrl.addMoneyForm);
router.post('/add-money', paymentCtrl.initiatePayment);
router.post('/verify-payment', paymentCtrl.verifyPayment);
router.post('/initiate-payment', paymentCtrl.initiatePayment);

module.exports = router;
 