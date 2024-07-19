
const Category = require('../models/categorySchema');

// Fetch all categories
const getCategories = async (req, res) => {
    try {
        if (req.session.admin) {
            const categories = await Category.find();
            res.render('admin/categories', { title: "Category List", categories, layout: 'adminLayout' });
        } else {
            res.redirect('/admin/login');
        } 
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

// Render the add category page
const getAddCategoryPage = (req, res) => {
    res.render('admin/addCategory', { title: "Add Category", layout: 'adminLayout' });
};

// Add a new category
const addCategory = async (req, res) => {
    try {
        const { name, description, discountPercentage, expiryDate } = req.body;
        const image = req.file ? req.file.filename : null;

        const normalizedName = name.toLowerCase();

        // Check if category name already exists
        const existingCategory = await Category.findOne({ nameLower: normalizedName });
        if (existingCategory) {
            return res.render('admin/addCategory', {
                title: "Add Category",
                errorMessage: "Category name already exists. Please choose another name.",
                layout: 'adminLayout'
            });
        }

        const offer = {
            discountPercentage : discountPercentage || 0,
            expiryDate: expiryDate || null 
        }

        const newCategory = new Category({ name, description, image, nameLower: normalizedName, offer });
        await newCategory.save();

        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error); 
        res.redirect('/admin/categories');
    }
};

// Render the edit category page
const getEditCategoryPage = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        res.render('admin/editCategory', { title: "Edit Category", category, layout: 'adminLayout' });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

const updateCategory = async (req, res) => {
    try {
        const { name, description, discountPercentage, expiryDate } = req.body;
        const image = req.file ? req.file.filename : req.body.existingImage;

        // Normalize the name for consistency
        const normalizedName = name.toLowerCase();

        // Check if another category with the same name exists
        const existingCategory = await Category.findOne({ 
            nameLower: normalizedName, 
            _id: { $ne: req.params.id } 
        });

        if (existingCategory) {
            const category = await Category.findById(req.params.id);
            return res.render('admin/editCategory', {
                title: "Edit Category",
                errorMessage: "Category name already exists. Please choose another name.",
                category,
                layout: 'adminLayout'
            });
        }

        // Update category with new details
        await Category.findByIdAndUpdate(req.params.id, { 
            name, 
            description, 
            image, 
            nameLower: normalizedName,
            offer: {
                discountPercentage: discountPercentage || 0,
                expiryDate: expiryDate || null
            }
        });

        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};



// Delete a category
const deleteCategory = async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/categories');
    }
};

// List a category
const listCategory = async (req, res) => {
    try {
        await Category.findByIdAndUpdate(req.params.id, { status: 'listed' });
        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/categories');
    }
};
 
// Unlist a category
const unlistCategory = async (req, res) => {
    try { 
        await Category.findByIdAndUpdate(req.params.id, { status: 'unlisted' });
        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/categories');
    }
};

module.exports = { 
    getCategories,
    getAddCategoryPage,
    addCategory,
    getEditCategoryPage,
    updateCategory,
    deleteCategory,
    listCategory,
    unlistCategory
};