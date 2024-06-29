const Category = require('../models/categorySchema');
const Product = require('../models/productSchema');

const getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 5; 
 
        const skip = (page - 1) * limit;
        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);

        const products = await Product.find().populate('category').skip(skip).limit(limit);

        res.render('admin/productList', {
            layout: 'adminLayout',
            title: "Product Management",
            products,
            currentPage: page,
            totalPages,
        });
    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.redirect('/admin');
    }
};


const getProductForm = async (req, res) => {
    try {
        const categories = await Category.find(); // Fetch all categories
        console.log('Categories fetched from database:', categories);
        
        res.render('admin/addProduct', {
            layout: 'adminLayout',
            title: "Add Product",
            categories 
        });
    } catch (error) {
        console.error('Error fetching categories:', error.message);
        res.redirect('/admin/products');
    }
};



const addProduct = async (req, res) => {
    try {
        const { name, description, price,mrp, stock, category, discountPercentage, expiryDate } = req.body;
        const mainImage = req.files['mainImage'] ? `/uploads/products/${req.files['mainImage'][0].filename}` : '';
        
      
        let subImages = [];
        if (req.files['subImages']) {
            subImages = req.files['subImages'].map(file => `/uploads/products/${file.filename}`);
        }

        console.log('Category Name from Request Body:', category);

        const categoryDoc = await Category.findOne({ name: category });
        console.log('Category Document from Database:', categoryDoc);

        if (!categoryDoc) {
            console.log('Category not found in the database');
            return res.status(400).send('Category not found');
        }

         // Check if category has a discount
         if (categoryDoc.offer && categoryDoc.offer.discountPercentage > 0) {
            if (discountPercentage && discountPercentage > 0) {
                return res.status(400).send('Category already has a discount. Cannot apply another discount.');
            }
        }

        const product = new Product({
            name,
            description,
            price,
            mrp,
            stock,
            category: categoryDoc._id,
            mainImage,
            subImages,
            offer: {
                discountPercentage,
                expiryDate
            }
        });

        await product.save();
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error adding product:', error.message);
        res.redirect('/admin/products');
    }
};

const getEditProductForm = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        const categories = await Category.find(); // Fetch all categories 
        res.render('admin/editProduct', {
            layout: 'adminLayout',
            title: "Edit Product",
            product,
            categories 
        });
    } catch (error) {
        console.error('Error fetching product:', error.message);
        res.redirect('/admin/products');
    }
};

const editProduct = async (req, res) => {
    try {
        const { name, description, price, mrp, stock, category, discountPercentage, expiryDate, status } = req.body; 
        let mainImage = req.body.existingMainImage;

        if (req.files['mainImage'] && req.files['mainImage'][0].filename) {
            mainImage = `/uploads/products/${req.files['mainImage'][0].filename}`;
        }

        const categoryDoc = await Category.findById(category);
        if (!categoryDoc) {
            console.error('Category not found');
            return res.status(400).send('Category not found');
        }

        // Handle sub-images update
        let subImages = req.body.existingSubImages ? req.body.existingSubImages.split(',') : [];
        if (req.files['subImages']) {
            req.files['subImages'].forEach(file => {
                subImages.push(`/uploads/products/${file.filename}`);
            });
        }

        const product = await Product.findById(req.params.id);

        // Allow updating expiry date and other details without blocking for existing discount
        let updateOffer = product.offer || {}; // Use existing offer details if present

        // Update only if there's a new valid discount percentage
        if (discountPercentage && discountPercentage > 0) {
            // Check for conflicting category discount
            if (categoryDoc.offer && categoryDoc.offer.discountPercentage > 0) {
                return res.status(400).send('Category already has a discount. Cannot apply another discount.');
            }
            updateOffer.discountPercentage = discountPercentage;
        }

        if (expiryDate) {
            updateOffer.expiryDate = expiryDate;
        }

        const updateData = {
            name,
            description,
            price,
            mrp,
            stock,
            category: categoryDoc._id,
            subImages,
            status,
            mainImage,
            offer: updateOffer,
        }; 

        await Product.findByIdAndUpdate(req.params.id, updateData);
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error editing product:', error.message);
        res.redirect('/admin/products');
    }
};



const deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error deleting product:', error.message);
        res.redirect('/admin/products');
    }
};

const listProduct = async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, { status: 'listed' });
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error listing product:', error.message);
        res.redirect('/admin/products');
    }
};

const unlistProduct = async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, { status: 'unlisted' });
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error unlisting product:', error.message);
        res.redirect('/admin/products');
    }
};

module.exports = {
    getAllProducts,
    getProductForm,
    addProduct,
    getEditProductForm,
    editProduct,
    deleteProduct,
    listProduct,
    unlistProduct,
};
