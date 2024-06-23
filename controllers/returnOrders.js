const ReturnOrder = require('../models/returnOrdersSchema');
const Order = require('../models/orderSchema');

module.exports = {
    
    loadReturnOrders: async (req, res) => {
        try {

            const returnOrders = await ReturnOrder.find()
                .populate('orderId')
                .populate({
                    path: 'userId',
                    select: 'firstname lastname'
                })
                .lean();

            res.render('admin/return_orders', { returnOrders, layout: 'adminLayout' });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    },

    // View details of a specific order
    viewReturnOrder: async (req, res) => {
        try {
            const returnOrderId = req.params.id;
            const returnOrder = await ReturnOrder.findById(returnOrderId)
                .populate({
                    path: 'orderId',
                    populate: {
                        path: 'items.product',
                        select: 'name mainImage'
                    }
                })
                .populate('userId')
                .lean();

            if (!returnOrder) {
                return res.status(404).send('Return order not found');
            }

            res.render('admin/view_return_order', { returnOrder, layout: 'adminLayout' });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    },

    // Update return order status
   updateReturnOrderStatus: async (req, res) => {
        try {
            const returnOrderId = req.params.id;
            const { status } = req.body;

            const updatedReturnOrder = await ReturnOrder.findByIdAndUpdate(returnOrderId, {
                status: status,
                processedAt: new Date()
            }, { new: true });

            if (status === 'Approved' || status === 'Rejected' || status === 'Canceled') {
                await Order.findByIdAndUpdate(updatedReturnOrder.orderId, {
                    status: status === 'Approved' ? 'Returned' : 'Delivered', 
                    returnStatus: status
                });
            }

            res.redirect('/admin/return-orders');
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    }
};
