const orderModel = require('../model/order_schema')
const Products = require('../model/product_schema')
const { format, parseISO, formatDate } = require('date-fns');
const mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

const orderList = async (req,res)=>{
    try {
        const orderData = await orderModel.find().populate('user')
        return res.render('orderList',{orderData})
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('couldnt find order list')        
    }
}

const orderDetails = async (req, res) => {
    try {
        const orderData = await orderModel.findOne({ _id: req.params.id }).populate('user')
        
        if (!orderData) {
            console.log('Order data not found');
            return res.status(404).send('Order not found');
        }

        // Parse and format the date
      
        const date = parseISO(orderData.orderDate.toISOString());
        const formattedDate = format(date, 'EEE, MMM d, yyyy, h:mma');

        // Render the template with the formatted date
        return res.render('orderDetails', { orderData, formattedDate });
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Order details page loaded error');
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        
        const { status, itemId } = req.body;
        

        const validStatuses = orderModel.schema.path('orderStatus').enumValues;
        
        
        if (!validStatuses.includes(status)) {
            
            return res.status(400).json({ error: 'Invalid order status' });
        }

        const itemIdObject = new ObjectId(itemId);
       

        const order = await orderModel.findOne({ "items._id": itemIdObject });
        
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const item = order.items.id(itemIdObject);
       
        
        if (!item) {
            
            return res.status(404).json({ error: 'Item not found' });
        }

        if (item.itemOrderStatus === 'cancelled' || item.itemOrderStatus === 'delivered') {
            
            return res.status(400).json({ error: 'Cannot change status of cancelled or delivered items' });
        }
        if(status  === 'cancelled'){
            await Products.findOneAndUpdate({_id:item.product},{$inc:{product_quantity:item.quantity}})
        }
        item.itemOrderStatus = status;
        await order.save();

        const allItemsCancelled = order.items.every(item => item.itemOrderStatus === 'cancelled');
        

        if (allItemsCancelled) {
            await orderModel.updateOne({ _id: order._id }, { $set: { orderStatus: 'cancelled' } });
            return res.status(200).json({ message: 'All items are cancelled, order status updated to cancelled', success: true ,order});
        } else {
            await orderModel.updateOne({ _id: order._id }, { $set: { orderStatus: status } });
            return res.status(200).json({ message: 'Successfully changed the order status', success: true ,order});
        }
    } catch (error) {
        console.error('Error updating order status:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


module.exports ={
    orderList,
    orderDetails,
    updateOrderStatus
}