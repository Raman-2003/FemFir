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

        const product = await Product.findById(productId).populate('category');
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

       
        let effectivePrice = product.price;
        
      
        if (product.offer && product.offer.discountPercentage > 0) {
            const currentDate = new Date();
            if (!product.offer.expiryDate || new Date(product.offer.expiryDate) >= currentDate) {
                effectivePrice -= (product.offer.discountPercentage / 100) * product.price;
            }
        }

       
        if (product.category && product.category.offer && product.category.offer.discountPercentage > 0) {
            const currentDate = new Date();
            if (!product.category.offer.expiryDate || new Date(product.category.offer.expiryDate) >= currentDate) {
                const categoryDiscount = (product.category.offer.discountPercentage / 100) * product.price;
                if (categoryDiscount > (product.offer ? product.offer.discountPercentage : 0)) {
                    effectivePrice = product.price - categoryDiscount;
                }
            }
        }

        const cartItem = user.cart.find(item => item.product.toString() === productId);

        if (cartItem) {
            cartItem.quantity += quantity;
            cartItem.total = cartItem.quantity * effectivePrice;
            cartItem.mrpTotal = cartItem.quantity * product.mrp; 
        } else {
            user.cart.push({ 
                product: productId, 
                quantity: quantity, 
                total: effectivePrice * quantity,
                mrpTotal: product.mrp * quantity 
            });
        }

        await user.save();
        res.json({ success: true, message: 'Item added to cart' });
    } catch (error) {
        console.error('Error adding to cart:', error);
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
            if (!item.product || !item.product.price) {
                console.error(`Product data is missing for cart item: ${item._id}`);
                return;
            }

            let effectivePrice = item.product.price;
            let appliedDiscount = 0;

            if (item.product.offer && item.product.offer.discountPercentage > 0) {
                const currentDate = new Date();
                if (!item.product.offer.expiryDate || new Date(item.product.offer.expiryDate) >= currentDate) {
                    appliedDiscount = (item.product.offer.discountPercentage / 100) * item.product.price;
                    effectivePrice -= appliedDiscount;
                }
            }

            if (item.product.category && item.product.category.offer && item.product.category.offer.discountPercentage > 0) {
                const currentDate = new Date();
                if (!item.product.category.offer.expiryDate || new Date(item.product.category.offer.expiryDate) >= currentDate) {
                    const categoryDiscount = (item.product.category.offer.discountPercentage / 100) * item.product.price;
                    if (categoryDiscount > appliedDiscount) {
                        effectivePrice = item.product.price - categoryDiscount;
                    }
                }
            }

            item.discountedPrice = appliedDiscount > 0 ? effectivePrice : item.product.price;
            item.total = (effectivePrice * item.quantity).toFixed(0);
            subTotal += parseInt(item.total);

            item.mrpTotal = (item.product.mrp * item.quantity).toFixed(0);
        });

        const shippingCost = 0;
        const grandTotal = subTotal + shippingCost;

        if (cart.length === 0) {
            res.render('user/empty_cart', { userData });
        } else {
            res.render('user/cart', { userData, cart, subTotal: subTotal.toFixed(0), grandTotal: grandTotal.toFixed(0), shippingCost: shippingCost.toFixed(0) });
        }
    } catch (error) {
        console.error('Error loading cart:', error);
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

        const shippingCost = 0;
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

        let effectivePrice = cartItem.product.price;

        // Calculate effective price with product offer
        if (cartItem.product.offer && cartItem.product.offer.discountPercentage > 0) {
            const currentDate = new Date();
            if (!cartItem.product.offer.expiryDate || new Date(cartItem.product.offer.expiryDate) >= currentDate) {
                effectivePrice -= (cartItem.product.offer.discountPercentage / 100) * cartItem.product.price;
            }
        }

        // Calculate effective price with category offer
        if (cartItem.product.category && cartItem.product.category.offer && cartItem.product.category.offer.discountPercentage > 0) {
            const currentDate = new Date();
            if (!cartItem.product.category.offer.expiryDate || new Date(cartItem.product.category.offer.expiryDate) >= currentDate) {
                const categoryDiscount = (cartItem.product.category.offer.discountPercentage / 100) * cartItem.product.price;
                if (categoryDiscount > (cartItem.product.offer ? cartItem.product.offer.discountPercentage : 0)) {
                    effectivePrice = cartItem.product.price - categoryDiscount;
                }
            }
        }

        cartItem.quantity = quantity;
        cartItem.total = quantity * effectivePrice;
        cartItem.mrpTotal = quantity * cartItem.product.mrp; 
        
        await user.save();

        let subTotal = 0;
        user.cart.forEach(item => {
            subTotal += item.total;
        });
        const shippingCost = 0;
        const grandTotal = subTotal + shippingCost;
        res.json({ success: true, subTotal, grandTotal, cart: user.cart });
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

       
        const promises = cart.map(async item => {
            const product = await Product.findById(item.product._id);
            if(!product || product.stock === 0){
                throw new Error(`Product ${item.product.name} is out of stock`);
            }
        })

        await Promise.all(promises);
        
       
        const addresses = await Address.find({ userId }).lean();

        // Calculate cart totals
        let subTotal = 0;
        cart.forEach(item => {
            item.mrpTotal = (item.product.mrp * item.quantity).toFixed(0); 
            subTotal += item.product.price * item.quantity;
        });

        subTotal = parseInt(subTotal.toFixed(0));

        const shippingCost = 0; 
        let grandTotal = (parseInt(subTotal) + shippingCost).toFixed(0);



        // Calculate referral discount
        let referralDiscountAmount = 0;
       if (user.hasUsedReferral) {
            referralDiscountAmount = ((grandTotal * 25) / 100).toFixed(0);
            grandTotal = (grandTotal - referralDiscountAmount).toFixed(0);
        }

        // Render checkout view with necessary data
        res.render('user/checkout', {
            userData,
            cart,
            subTotal,
            grandTotal: parseInt(grandTotal),
            shippingCost,
            referralDiscountAmount: parseInt(referralDiscountAmount), 
            addresses,
           
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
