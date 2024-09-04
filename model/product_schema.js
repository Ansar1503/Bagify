const mongoose = require('mongoose');

const product_schema = new mongoose.Schema({
    product_name:{
        type:String,
        required:true
    },
    product_regular_price:{
        type:Number,
        required:true
    },
    product_category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'categories',
        required:true
    },
    product_description:{
        type:String,
        required:true
    },
    product_quantity:{
        type:Number,
        required:true
    },
    product_images:{
        type:[String],
        required:true,
        default:[]
    },
    product_sale_price:{
        type:Number,
        required:true
    },
    product_brand:{
        type:String,
        required:true
    },
    isActive:{
        type:Boolean,
        required:false,
        default:true
    },
    inWishList:{
        type:Boolean,
        required:false,
    }

},{timestamps:true})

module.exports = mongoose.model('products',product_schema)