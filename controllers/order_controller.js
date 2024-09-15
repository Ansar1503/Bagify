const orderModel = require('../model/order_schema')
const Products = require('../model/product_schema')
const Return  = require('../model//order_return_Schema')
const Wallet = require('../model/wallet_schema')
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

   
      
        const date = parseISO(orderData.orderDate.toISOString());
        const formattedDate = format(date, 'EEE, MMM d, yyyy, h:mma');

       
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
        if(status  === 'delivered'){
            order.paymentStatus = 'completed'
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
            item.deliveredDate  = sevenDaysFromNow
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

const returnList = async (req,res)=> {
    try {
        const returnList = await Return.find().populate([{path:'order',populate:{path:'user'}},{path:'product'}])
        console.log(returnList);
        
        if(!returnList){
            return res.status(404).send(`<h1>No Returns found</h1>`)
        }
        return res.render('returnOrder',{returnList})
    } catch (error) {
        console.error('error:',error.message)
        return res.status(400).send('internal server error')
    }
}

const returnStatusChange = async (req, res) => {
    try {
        const accept = req.query.accept === 'true';  // Directly convert to boolean
        
        if (accept === null || accept === undefined) {
            return res.status(400).send('Please choose accept or reject');
        }

        const returnId = new mongoose.Types.ObjectId(req.query.return);
        const returnData = await Return.findById(returnId);
        if (!returnData) {
            return res.status(400).send('Return request not found');
        }

        const orderData = await orderModel.findOne({ "items._id": returnData.orderItemId });
        if (!orderData) {
            return res.status(400).send('Order not found');
        }

        const itemDetails = orderData.items.find(item => item._id.toString() === returnData.orderItemId.toString());
        if (!itemDetails) {
            return res.status(400).send('Item not found in the order');
        }

        const wallet = await Wallet.findOne({ user: orderData.user });

        let itemAmount = itemDetails.price * itemDetails.quantity;

       
        if (itemDetails.itemOffer?.offerAmount) {
            itemAmount = (itemDetails.price - itemDetails.itemOffer.offerAmount) * itemDetails.quantity;
        }
        
       
        let discountAmount = 0;
        if (orderData.couponDiscount) {
            discountAmount = Math.ceil(orderData.couponDiscount * itemAmount / orderData.totalAmount);
            itemAmount -= discountAmount; 
        }
        
      
        orderData.offerDiscount = Math.max(0, orderData.offerDiscount - (itemDetails.itemOffer?.offerAmount || 0));
        orderData.subTotalAmount = Math.max(0, orderData.subTotalAmount - (itemDetails.price * itemDetails.quantity));
        orderData.totalAmount = Math.max(0, orderData.totalAmount - itemAmount);
        orderData.couponDiscount = Math.max(0, orderData.couponDiscount - discountAmount);
        
        if (!accept) {
            returnData.returnProductStatus = 'returnRejected';
            itemDetails.itemOrderStatus = 'returnRejected';
            await orderData.save();
            await returnData.save();
            return res.status(200).redirect('/admin/orders/returns');
        }

        returnData.returnProductStatus = 'returnApproved';
        itemDetails.itemOrderStatus = 'returnApproved';

        const transaction = {
            orderId: orderData._id,
            amount: itemAmount,  
            status: 'success',
            type: 'credit',
            razorpaymentId: orderData.onlinePaymentId || orderData._id.toString()
        };

        if (wallet) {
            wallet.transactions.push(transaction);
            wallet.balance += transaction.amount;
            await wallet.save();
        } else {
            await new Wallet({
                balance: transaction.amount,
                user: orderData.user,
                transactions: [transaction]
            }).save();
        }

        if (itemDetails.product) {
            await Products.findByIdAndUpdate(itemDetails.product, { $inc: { product_quantity: itemDetails.quantity } });
        } else {
            return res.status(404).send('Product not found');
        }

        await orderData.save();
        await returnData.save();

        return res.status(200).redirect('/admin/orders/returns');

    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Internal server error');
    }
};


module.exports ={
    orderList,
    orderDetails,
    updateOrderStatus,
    returnList,
    returnStatusChange
}