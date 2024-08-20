const orderModel = require('../model/order_schema')
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

const orderDetails = async (req,res)=>{
    try {
        const orderData = await orderModel.findOne({_id:req.params.id})
        // console.log(orderData);
        
        if(!orderData){
            console.log('order data not found');            
        }
        return res.render('orderDetails',{orderData})
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('order details page loaded error')
    }
}

const updateOrderStatus = async(req,res)=>{
    try {       
        const status = req.body.selectedStatus
        const orderId =  new ObjectId(req.body.orderId)

        const validStatuses = orderModel.schema.path('orderStatus').enumValues

        if (!validStatuses.includes(status)) {

            return res.status(400).json({ error: 'Invalid order status' });
  
          }
          const order = await orderModel.findOne({_id:orderId})
          if(!order){

            console.log(`order cannot found`);

            return
        }

        const allItemsCancelled = order.items.every(item => item.itemOrderStatus === "cancelled");
        
        if(!allItemsCancelled){
            order.items.forEach(item =>{

                if(item.itemOrderStatus !=="cancelled"){
    
                    Object.assign(item,{itemOrderStatus:status})
                }
            })
            const updatedStatusPerItem = await order.save()

            if(updatedStatusPerItem){

                const updatedOrder = await orderModel.updateOne({_id:orderId},{$set:{orderStatus:status}},{new:true})

                return res.status(200).json({message:"successfully changed the order status",success:true, updatedOrder: updatedOrder})

            }
         }else{

            return res.status(200).json({ message: "User cancelled all products", adminCannotCancel: true });

        }
        return res.status(400).json({
            message: "Order status unchanged",
            success: false
        });


    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal server error");
    }
}

module.exports ={
    orderList,
    orderDetails,
    updateOrderStatus
}