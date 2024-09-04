const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId  = Schema.Types.ObjectId

const coupon =  new Schema({
    name: {
        type: String,
        required: true
    },
    couponCode: {
        type: String,
        required: true,
        unique: true
    },
    couponDiscount: {
        type: Number,
        required: true
    },
    discountType: {
        type: String,
        enum: ['fixed', 'percentage'],
        required: true
    },
    couponStatus: {
        type: Boolean,
        required: true
    },
    maxAmount: {
        type: Number,
        required: true
    },
    minAmount: {
        type: Number,
        required: true
    },
    expirationDate: {
        type: Date,
        required: false
    },
    usageLimit: {
        type: Number,
        required: false,
        default: Infinity
    },
    usageCount: {
        type: Number,
        default: 0
    },
    applicableCategories: [{
        type: String,
        required: false
    }],
    applicableProducts: [{
        type: ObjectId,
        ref: 'Product',
        required: false
    }],
    usedBy: [{
        type: ObjectId,
        ref: 'User'
    }],
},{timestamps:true})

