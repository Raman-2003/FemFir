const Product = require('../models/productSchema');
const Category = require('../models/categorySchema');
const User = require('../models/userSchema');
const Wishlist = require('../models/wishlistSchema');
const mongoose = require('mongoose');

const ObjectId = require('mongoose').Types.ObjectId;
const swal = require('sweetalert');

const showWishlistPage = async (req, res) => {
    const userData = req.session.user;

    if (!userData || !userData._id) {
        console.error("User data or user ID is missing from the session.");
        return res.redirect('/login'); 
    }

    try {
        const userId = new mongoose.Types.ObjectId(userData._id);

        const WishListProd = await Wishlist.aggregate([
            {
                $match: { user: userId }
            },
            {
                $unwind: '$productId'
            },
            {
                $lookup: {
                    from: 'products',
                    foreignField: '_id',
                    localField: 'productId',
                    as: 'product'
                }
            },
            {
                $project: {
                    _id: 1,
                    productId: 1,
                    productName: { $arrayElemAt: ['$product.name', 0] },
                    productImage: { $arrayElemAt: ['$product.mainImage', 0] },
                    productPrice: { $arrayElemAt: ['$product.price', 0] },
                    productQuantity: { $arrayElemAt: ['$product.stock', 0] }
                }
            }
        ]);

        res.render('user/wishlist', { userData, WishListProd });

    } catch (error) {
        console.error("An error occurred while fetching the wishlist:", error);
        res.status(500).send('Internal Server Error');
    }
}

const addToWishList = async (req, res) => {
    try {
        let { id } = req.body;
        console.log('Received product ID to add:', id);

        const userId = req.session.user._id;
        console.log('User ID:', userId);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.error('Invalid product ID');
            return res.json({ success: false, message: 'Invalid product ID' });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.error('Invalid user ID');
            return res.json({ success: false, message: 'Invalid user ID' });
        }

        const productId = new mongoose.Types.ObjectId(id);

        const existingWishlist = await Wishlist.findOne({ user: userId, productId: productId });
        if (existingWishlist) {
            console.log('Product is already in the wishlist');
            return res.json({ success: false, message: 'Product is already in the wishlist' });
        }

        let WishlistData = await Wishlist.updateOne(
            { user: userId },
            { $addToSet: { productId: productId } },
            { upsert: true }
        );

        if (WishlistData.modifiedCount > 0 || WishlistData.upserted) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Product not added to wishlist' });
        }
    } catch (error) {
        console.error('Error while adding to wishlist:', error);
        res.json({ success: false, message: 'Server error' });
    }
};


const removeFromWishList = async (req, res) => {
    try {
        const { id, wishId } = req.body;

        const productIdToRemove = new mongoose.Types.ObjectId(id);
        const wishListId = new mongoose.Types.ObjectId(wishId);

        // Use $pull to remove the product
        const result = await Wishlist.updateOne(
            { _id: wishListId },
            { $pull: { productId: productIdToRemove } }
        );

        if (result.modifiedCount > 0) {
            res.json({ success: true });
        } else {
            console.error('No documents were updated. Check if the wishlist and product IDs are correct.');
            res.json({ success: false, message: 'Product not removed. Check the IDs.' });
        }
    } catch (error) {
        console.error('Error during removal from wishlist:', error);
        res.json({ success: false, message: 'Server error during wishlist update.' });
    }
};


const addToCartFromWishlist = async (req, res) => {
    try {
        const userData = req.session.user;
        if (!userData) {
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }

        const userId = userData._id;
        const { id: productId } = req.body; 
        const quantity = 1; 

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
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
        } else {
            user.cart.push({ product: productId, quantity: quantity, total: product.price * quantity });
        }

        await Wishlist.updateOne({ user: userId }, { $pull: { productId: productId } });

        await user.save();
        res.json({ success: true, message: 'Item added to cart from wishlist' });
    } catch (error) {
        console.error('Error while adding to cart from wishlist:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



module.exports = {
    showWishlistPage,
    addToWishList,
    removeFromWishList,
    addToCartFromWishlist 
}

