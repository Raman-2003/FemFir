const User = require('../models/userSchema');
const Product = require('../models/productSchema');
const Coupon = require('../models/couponSchema');
const moment = require('moment');
const Address = require('../models/addressSchema');



const addToCart = async (req, res) => {
    try {
        const userData = req.session.user;
        if (!userData) {
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }

        const userId = userData._id;
        const { id: productId, quantity } = req.body;

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({ success: false, message: 'Invalid quantity' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const cartItem = user.cart.find(item => item.product.toString() === productId);

        if (cartItem) {
            cartItem.quantity += quantity;
            cartItem.total = cartItem.quantity * product.price;
            cartItem.mrpTotal = cartItem.quantity * product.mrp; // Update MRP total
        } else {
            user.cart.push({ product: productId, quantity: quantity, total: product.price * quantity });
        }

        await user.save();
        res.json({ success: true, message: 'Item added to cart' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};





const loadCart = async (req, res) => {
    try {
        const userData = req.session.user;
        if (!userData) {
            return res.status(401).json({ message: 'User not logged in' });
        }
        const userId = userData._id;

        const user = await User.findById(userId).populate('cart.product').lean();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const cart = user.cart || [];
        let subTotal = 0;
        cart.forEach(item => {
            item.total = item.product.price * item.quantity;
            item.mrpTotal = item.product.mrp * item.quantity; // Calculate MRP total
            subTotal += item.total;
        });

        const shippingCost = 0;
        // const platformFee = 20;
        const grandTotal = subTotal + shippingCost;

        if (cart.length === 0) {
            res.render('user/empty_cart', { userData });
        } else {
            res.render('user/cart', { userData, cart, subTotal, grandTotal, shippingCost });
        }
    } catch (error) {
        res.status(500).render('error');
    }
};


const removeCart = async (req, res) => {
    try {
        const userData = req.session.user;
        if (!userData) {
            return res.status(401).json({ message: 'User not logged in' });
        }
        const userId = userData._id;
        const proId = req.query.proId;

        await User.updateOne({ _id: userId }, { $pull: { cart: { product: proId } } });

        const user = await User.findById(userId).populate('cart.product').lean();
        const cart = user.cart || [];
        let subTotal = 0;
        cart.forEach(item => {
            subTotal += item.product.price * item.quantity;
        });

        const shippingCost = 1;
        const grandTotal = subTotal + shippingCost;
        res.json({ success: true, subTotal, grandTotal, message: 'Item removed from cart' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};


const updateCart = async (req, res) => {
    try {
        const userData = req.session.user;
        if (!userData) {
            console.log('User not logged in');
            return res.status(401).json({ message: 'User not logged in' });
        }
        const cartUpdates = req.body.datas;
        const userId = userData._id;

        console.log(`Updating cart for user ${userId}`, cartUpdates);

        if (!Array.isArray(cartUpdates)) {
            console.log('Invalid cart update data');
            return res.status(400).json({ message: 'Invalid cart update data' });
        }

        const user = await User.findById(userId).lean();
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ message: 'User not found' });
        }

        cartUpdates.forEach(update => {
            const cartItem = user.cart.find(item => item.product.toString() === update.productId);
            if (cartItem) {
                cartItem.quantity = update.quantity;
            }
        });

        await User.updateOne({ _id: userId }, { $set: { cart: user.cart } });

        console.log('Cart updated successfully');
        res.json({ message: 'Cart updated' });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ message: 'Server error' });
    }
};



const updateCartQuantity = async (req, res) => {
    try {
        const userData = req.session.user;
        if (!userData) {
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }

        const userId = userData._id;
        const { productId, quantity } = req.body;

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({ success: false, message: 'Invalid quantity' });
        }

        const user = await User.findById(userId).populate('cart.product');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const cartItem = user.cart.find(item => item.product._id.toString() === productId);
        if (!cartItem) {
            return res.status(404).json({ success: false, message: 'Product not found in cart' });
        }

        cartItem.quantity = quantity;
        cartItem.total = quantity * cartItem.product.price;
        cartItem.mrpTotal = quantity * cartItem.product.mrp; // Update MRP total
        
        await user.save();

        let subTotal = 0;
        user.cart.forEach(item => {
            subTotal += item.total;
        });
        // const cartTotal = await user.cart.total
        const shippingCost = 0;
        const grandTotal = subTotal + shippingCost;
        res.json({ success: true, subTotal, grandTotal });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


const checkoutSuccess = async (req, res) => {
    try {
        console.log('Checkout success page accessed');
        res.render('user/checkout_success', { userData: req.session.user });
    } catch (error) {
        console.error('Error rendering checkout success page:', error);
        res.status(500).render('error');
    }
};

const checkoutFailure = async (req, res) => {
    try {
        console.log('Checkout failure page accessed');
        res.render('user/checkout_failure', { userData: req.session.user });
    } catch (error) {
        console.error('Error rendering checkout failure page:', error);
        res.status(500).render('error');
    }
};
 

const getCheckoutPage = async (req, res) => {
    try {
        const userData = req.session.user;
        if (!userData) {
            console.log('User not logged in');
            return res.redirect('/login');
        }

        const userId = userData._id;
        
        // Fetch user details including cart items
        const user = await User.findById(userId).populate('cart.product').lean();
        const cart = user.cart || [];

        //check if any product in cart has zero stock
        const promises = cart.map(async item => {
            const product = await Product.findById(item.product._id);
            if(!product || product.stock === 0){
                throw new Error(`Product ${item.product.name} is out of stock`);
            }
        })

        await Promise.all(promises);
        
        // Fetch user's addresses
        const addresses = await Address.find({ userId }).lean();

        // Calculate cart totals
        let subTotal = 0;
        cart.forEach(item => {
            item.mrpTotal = item.product.mrp * item.quantity; // Calculate MRP total
            subTotal += item.product.price * item.quantity;
        });

        const shippingCost = 0; 
        const grandTotal = subTotal + shippingCost;

        // Render checkout view with necessary data
        res.render('user/checkout', {
            userData,
            cart,
            subTotal,
            grandTotal,
            shippingCost,
            addresses 
        });
    } catch (error) {
        console.error('Error rendering checkout page:', error);
        res.status(500).render('error');
    }
};

module.exports = {
    addToCart,
    loadCart,
    removeCart,
    updateCart,
    updateCartQuantity,
    checkoutSuccess,
    checkoutFailure,
    getCheckoutPage
};
