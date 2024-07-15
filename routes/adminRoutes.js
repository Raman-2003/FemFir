
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
const User = require('../models/userSchema'); 
const mongoose = require('mongoose');
const moment = require('moment'); // Ensure moment is required
const Ledger = require('../models/ledgerSchema');


router.get('/', async (req, res) => {
  try {

    const topOrderedProducts = await Order.aggregate([
        { $unwind: '$items' }, // Unwind the items array to process each product individually
        {
          $group: {
            _id: '$items.product',
            totalQuantity: { $sum: '$items.quantity' },
            totalPrice: { $sum: '$items.total' }
          }
        },
        {
          $lookup: {
            from: 'products', // Join with the products collection
            localField: '_id',
            foreignField: '_id',
            as: 'productDetails'
          }
        },
        { $unwind: '$productDetails' }, // Unwind the product details array
        {
            $lookup: {
                from: 'categories', // Join with the categories collection
      localField: 'productDetails.category',
      foreignField: '_id',
      as: 'categoryDetails'
            }
        },
        { $unwind: '$categoryDetails' }, // Unwind the category details array
        { $sort: { totalQuantity: -1 } }, // Sort by total quantity in descending order
        { $limit: 10 }, // Limit to top 5 products
        {
          $project: {
            productName: '$productDetails.name',
            productImage: '$productDetails.mainImage',
            categoryName: '$categoryDetails.name',
            price: '$productDetails.price',
            quantity: '$totalQuantity'
          }
        }
      ]);

      // New query to get top five selling categories
    const topSellingCategories = await Order.aggregate([
        { $unwind: '$items' }, // Unwind the items array to process each product individually
        {
          $lookup: {
            from: 'products', // Join with the products collection
            localField: 'items.product',
            foreignField: '_id',
            as: 'productDetails'
          }
        },
        { $unwind: '$productDetails' }, // Unwind the product details array
        {
          $lookup: {
            from: 'categories', // Join with the categories collection
            localField: 'productDetails.category',
            foreignField: '_id',
            as: 'categoryDetails'
          }
        },
        { $unwind: '$categoryDetails' }, // Unwind the category details array
        {
          $group: {
            _id: '$categoryDetails._id',
            categoryName: { $first: '$categoryDetails.name' },
            categoryImage: { $first: '$categoryDetails.image' },
            totalQuantity: { $sum: '$items.quantity' }
          }
        },
        { $sort: { totalQuantity: -1 } }, // Sort by total quantity in descending order
        { $limit: 5 } // Limit to top 5 categories
      ]);
  


      const overallSalesCount = await Order.countDocuments({ status: 'Delivered' });

      const overallOrderAmountResult = await Order.aggregate([
          { $match: { status: 'Delivered' } },
          { $unwind: '$items' },
          {
              $lookup: {
                  from: 'products',
                  localField: 'items.product',
                  foreignField: '_id',
                  as: 'productDetails'
              }
          },
          { $unwind: '$productDetails' },
          {
              $lookup: {
                  from: 'categories',
                  localField: 'productDetails.category',
                  foreignField: '_id',
                  as: 'categoryDetails'
              }
          },
          {
              $unwind: {
                  path: '$categoryDetails',
                  preserveNullAndEmptyArrays: true
              }
          },
          {
              $project: {
                  _id: 0,
                  quantity: '$items.quantity',
                  price: {
                      $cond: {
                          if: {
                              $gt: ['$productDetails.offer.discountPercentage', 0]
                          },
                          then: {
                              $multiply: ['$productDetails.price', { $divide: [{ $subtract: [100, '$productDetails.offer.discountPercentage'] }, 100] }]
                          },
                          else: {
                              $cond: {
                                  if: {
                                      $gt: ['$categoryDetails.offer.discountPercentage', 0]
                                  },
                                  then: {
                                      $multiply: ['$productDetails.price', { $divide: [{ $subtract: [100, '$categoryDetails.offer.discountPercentage'] }, 100] }]
                                  },
                                  else: '$productDetails.price'
                              }
                          }
                      }
                  }
              }
          },
          {
              $group: {
                  _id: null,
                  totalAmount: { $sum: { $multiply: ['$quantity', '$price'] } }
              }
          }
      ]);

      const overallOrderAmount = overallOrderAmountResult[0]?.totalAmount?.toFixed(0) || '0';

      const totalDiscountResult = await User.aggregate([
          { $group: { _id: null, totalDiscount: { $sum: '$totalDiscount' } } }
      ]);

      const totalDiscount = totalDiscountResult[0]?.totalDiscount?.toFixed(0) || '0';

      const totalUserCount = await User.countDocuments();

      res.render('admin/dashboard', { overallSalesCount, overallOrderAmount, totalDiscount,totalUserCount,topOrderedProducts, topSellingCategories, layout: 'adminLayout' });
  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
});




router.get('/order-analysis', async (req, res) => {
    const { filterType,dateRange, filterDate } = req.query;

    console.log(`Received request for filterType=${filterType},dateRange=${dateRange}, filterDate=${filterDate}`);

    try {
        let data;
        if (filterType === 'products') {
            data = await getProductOrderAnalysis(dateRange, filterDate);
        } else {
            data = await getCategoryOrderAnalysis(dateRange, filterDate);
        }

        console.log('Sending data:', data);
        res.json(data);
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Updated function for product order analysis
async function getProductOrderAnalysis(dateRange, filterDate) {
    const { startDate, endDate } = getDateRange(dateRange, filterDate);

    const orders = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
        { $unwind: '$items' },
        { $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productDetails'
        }},
        { $unwind: '$productDetails' },
        { $group: {
            _id: '$productDetails.name',
            totalQuantity: { $sum: '$items.quantity' }
        }},
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 }
    ]);

    const labels = orders.map(order => order._id);
    const data = orders.map(order => order.totalQuantity);

    return { labels, orders: data };
}

// Updated function for category order analysis
async function getCategoryOrderAnalysis(dateRange, filterDate) {
    const { startDate, endDate } = getDateRange(dateRange, filterDate);

    const orders = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
        { $unwind: '$items' },
        { $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productDetails'
        }},
        { $unwind: '$productDetails' },
        { $lookup: {
            from: 'categories',
            localField: 'productDetails.category',
            foreignField: '_id',
            as: 'categoryDetails'
        }},
        { $unwind: '$categoryDetails' },
        { $group: {
            _id: '$categoryDetails.name',
            totalQuantity: { $sum: '$items.quantity' }
        }},
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 }
    ]);

    const labels = orders.map(order => order._id);
    const data = orders.map(order => order.totalQuantity);

    return { labels, orders: data };
}

// Helper function to get date range based on selected option
function getDateRange(dateRange, filterDate) {
    const now = new Date();
    let startDate, endDate;

    switch (dateRange) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 1);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear() + 1, 0, 1);
            break;
        case 'custom':
            startDate = new Date(filterDate);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 1);
            break;
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 1);
            break;
    }

    return { startDate, endDate };
}

// Route to view ledger entries
router.get('/ledger', async (req, res) => {
    try {
        const ledgerEntries = await Ledger.find().populate('userId').sort({ createdAt: -1 });
        res.render('admin/ledger', { ledgerEntries , layout: 'adminLayout'});
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// Route to download ledger entries as CSV
router.get('/ledger/download', async (req, res) => {
    try {
        const ledgerEntries = await Ledger.find().populate('userId').sort({ createdAt: -1 });
        const csv = ledgerEntries.map(entry => ({
            EntryType: entry.entryType,
            UserId: entry.userId.firstname, // Assuming User model has a 'name' field
            Amount: entry.amount, 
            Description: entry.description,
            TransactionType: entry.transactionType,
            Status: entry.status,
            // CreatedAt: entry.createdAt
        }));

        res.header('Content-Type', 'text/csv');
        res.attachment('ledger.csv');
        res.send(csv.join('\n'));
    } catch (error) {
        res.status(500).send('Internal Server Error');
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
