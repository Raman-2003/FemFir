const Product = require('../models/productSchema');

const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.render('admin/productList', {
            layout: 'adminLayout',
            title: "Product Management",
            products
        });
    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.redirect('/admin');
    }
};

const getProductForm = (req, res) => {
    res.render('admin/addProduct', {
        layout: 'adminLayout',
        title: "Add Product"
    });
};

const addProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, mainImage, subImages } = req.body;
        const product = new Product({
            name,
            description,
            price,
            stock,
            category,
            mainImage,
            subImages: subImages.split(',')
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
        res.render('admin/editProduct', {
            layout: 'adminLayout',
            title: "Edit Product",
            product
        });
    } catch (error) {
        console.error('Error fetching product:', error.message);
        res.redirect('/admin/products');
    }
};

const editProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, mainImage, subImages, status } = req.body;
        await Product.findByIdAndUpdate(req.params.id, {
            name,
            description,
            price,
            stock,
            category,
            mainImage,
            subImages: subImages.split(','),
            status
        });
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error editing product:', error.message);
        res.redirect('/admin/products');
    }
};

const deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndRemove(req.params.id);
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error deleting product:', error.message);
        res.redirect('/admin/products');
    }
};

module.exports = {
    getAllProducts,
    getProductForm,
    addProduct,
    getEditProductForm,
    editProduct,
    deleteProduct
};
