
const express = require('express');
const router = express.Router();
const { uploadCategory, uploadProduct } = require('../multer/product_control');
const { isLogin, isLogout } = require('../middlewares/adminAuth');
const {
    adminHome,
    adminLogin,
    doadminLogin,
    doadminLogout,
    adminSignup,
    doadminsignup,
    getAllUsers,
    blockUser,
    unblockUser,
    loadCoupon,
    addCoupon,
    addCouponPost,
    deleteCoupon,
    editCoupon,
    editCouponPost,
    toggleStatusCoupon
} = require('../controllers/adminCtrl');
const categoryController = require('../controllers/categoryCtrl');
const productController = require('../controllers/productController');
const orderController = require('../controllers/order');
const returnOrdersController  = require('../controllers/returnOrders');
const salesController = require('../controllers/salesController');
const Sale = require('../models/saleSchema');
const Order = require('../models/orderSchema');


// router.get('/', isLogin, adminHome);
router.get('/', async (req, res) => {
    try {
      const overallSalesCount = await Sale.countDocuments({ status: 'Delivered' });
      
      const overallOrderAmountResult = await Order.aggregate([
        { $match: { status: 'Delivered' } },
        { $group: { _id: null, totalAmount: { $sum: '$totalAmount' } } }
    ]);

    // Extract the totalAmount value from the aggregation result
    const overallOrderAmount = overallOrderAmountResult[0]?.totalAmount || 0;

      res.render('admin/dashboard', { overallSalesCount,overallOrderAmount, layout: 'adminLayout' });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  });
 
router.get(['/','/adminlogin'], isLogout, adminLogin);
router.post('/adminlogin', isLogout, doadminLogin);
router.get('/signup', isLogout, adminSignup);
router.post('/signup', isLogout, doadminsignup);

router.get('/logout', isLogin, doadminLogout);

// Categories
router.get('/categories', isLogin, categoryController.getCategories);
router.get('/categories/add', isLogin, categoryController.getAddCategoryPage);
router.post('/categories/add', uploadCategory, categoryController.addCategory);
router.get('/categories/edit/:id', isLogin, categoryController.getEditCategoryPage);
router.post('/categories/edit/:id', isLogin, uploadCategory, categoryController.updateCategory);
router.get('/categories/delete/:id', isLogin, categoryController.deleteCategory);
router.get('/categories/list/:id', isLogin, categoryController.listCategory);
router.get('/categories/unlist/:id', isLogin, categoryController.unlistCategory);

// User Management
router.get('/userm', isLogin, getAllUsers);
router.get('/block/:id', isLogin, blockUser);
router.get('/unblock/:id', isLogin, unblockUser);

// Products
router.get('/products', isLogin, productController.getAllProducts);
router.get('/products/add', isLogin, productController.getProductForm);
router.post('/products/add', isLogin, uploadProduct, productController.addProduct);
router.get('/products/edit/:id', isLogin, productController.getEditProductForm);
router.post('/products/edit/:id', isLogin, uploadProduct, productController.editProduct);
router.get('/products/delete/:id', isLogin, productController.deleteProduct);
router.get('/products/list/:id', isLogin, productController.listProduct);
router.get('/products/unlist/:id', isLogin, productController.unlistProduct);

// Coupons Management
router.get('/coupons', loadCoupon);
router.get('/add_coupon', addCoupon);
router.post('/add_coupon', addCouponPost);
router.get('/delete_coupon', deleteCoupon);
router.get('/edit_coupon', editCoupon);
router.post('/edit_coupon', editCouponPost);
router.get('/toggle_status_coupon', toggleStatusCoupon);

// Orders Management
router.get('/orders', isLogin, orderController.getOrderListPageAdmin);
router.post('/orders/status', isLogin, orderController.changeOrderStatus);
router.get('/orders/details', isLogin, orderController.getOrderDetailsPageAdmin);


router.get('/return-orders',isLogin, returnOrdersController.loadReturnOrders);
router.get('/return-orders/:id',isLogin, returnOrdersController.viewReturnOrder);
router.post('/return-orders/:id/status',isLogin, returnOrdersController.updateReturnOrderStatus);

router.get('/report',isLogin, salesController.getReportPage);
router.post('/report',isLogin, salesController.generateReport);
router.get('/report/pdf',isLogin, salesController.generatePDF);
router.get('/report/excel',isLogin, salesController.generateExcel);


module.exports = router;
