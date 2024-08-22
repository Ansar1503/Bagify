const mongoose = require('mongoose');
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const orderItemsModel = new Schema({
    product:{
        type:ObjectId,
        ref:'products',
        required:true
    },
    productName:{
        type:String,
        required:true
    },
    brandName:{
        type:String,
        required:true
    },
    category:{
        type:ObjectId,
        ref:'categories',
        required:true
    },
    categoryName:{
        type:String,
        required:true
    },
    quantity:{
        type:Number,
        required:true,
        min:1
    },
    price:{
        type:Number,
        required:true
    },
    regularPrice:{
        type:Number,
        required:true,
    },
    images:{
        type:Array,
        required:true
    },
    itemOrderStatus:{
        type:String,
        required:true,
        enum:['pending','shipped','delivered','cancelled','returnInitiated','returnApproved','returnRejectd'],
        default:'pending'
    },
    paymentStatus:{
        type:String,
        required:true,
        default:'pending'
    }
},{timestamps:true})

const orderModel = Schema({
    onlinePaymentId:{
        type:String
    },
    items:[orderItemsModel],
    user:{
        type:ObjectId,
        ref:'userdatas',
        required:true
    },
    totalItems:{
        type:Number,
        required:true,
        default:1
    },
    subTotalAmount:{
        type:Number,
        required:true,
        default:0
    },
    discountAmount:{
        type:Number,
        required:false,
        default:0
    },
    totalAmount:{
        type:Number,
        required:true,
        default:0
    },
    orderDate:{
        type:Date,
        required:false,
        default:Date.now()
    },
    orderStatus:{
        type:String,
        required:false,
        enum:['pending','shipped','delivered','cancelled','returnInitiated','returnApproved','returnRejectd'],
        default:'pending'
    },
    paymentMethod:{
        type:String,
        required:true
    },
    shippingAddress:{
        fullname:{
            type:String,
            required:true
        },
        mobile: { 
            type: String,
             required: true
            },
        pincode: {
             type: String,
              required: true
             },
        altMobile: { 
            type: String, 
            required: false 
        },
        state: { 
            type: String, 
            required: true
        },
        primary: { 
            type: Boolean,
             default: true
            },
        city: { 
            type: String, 
            required: true
         },
         Address:{
            type:String,
            required:true
         },
        
    }
},{timestamps:true})

module.exports = mongoose.model('orders',orderModel)