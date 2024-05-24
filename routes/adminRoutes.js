const express = require('express');
const router = express.Router();
const Upload = require('../multer/product_control')

const {
    adminHome,
    adminLogin,
    doadminLogin,
    doadminLogout,
    adminSignup,
    doadminsignup,
    getAllUsers,
    blockUser,
    unblockUser
} = require('../controllers/adminCtrl');
const categoryController = require('../controllers/categoryCtrl');
const {
    getAllProducts,
    getProductForm,
    addProduct,
    getEditProductForm,
    editProduct,
    deleteProduct
} = require('../controllers/productController');


router.get('/', adminHome); 
router.get(['/','/adminlogin'], adminLogin);
router.post('/adminlogin', doadminLogin);

router.get('/signup', adminSignup);
router.post('/signup', doadminsignup);

router.get('/logout', doadminLogout);

// Category Routes
router.get('/categories', categoryController.getCategories);
router.get('/categories/add', categoryController.getAddCategoryPage);
router.post('/categories/add', Upload.single('image'), categoryController.addCategory);
router.get('/categories/edit/:id', categoryController.getEditCategoryPage);
router.post('/categories/edit/:id', Upload.single('image'), categoryController.updateCategory);
router.get('/categories/delete/:id', categoryController.deleteCategory);

router.get('/userm',  getAllUsers);
router.get('/block/:id', blockUser);
router.get('/unblock/:id', unblockUser);

router.get('/products', getAllProducts);
router.get('/products/add', getProductForm);
router.post('/products/add',Upload.single('mainImage'),addProduct);
router.get('/products/edit/:id', getEditProductForm);
router.post('/products/edit/:id',Upload.single('mainImage'),editProduct);
router.get('/products/delete/:id', deleteProduct);

module.exports = router;
