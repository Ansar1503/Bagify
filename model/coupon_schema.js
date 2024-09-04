const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId  = Schema.Types.ObjectId

const coupon =  new Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true
    },
    discountType: {
        type: String,
        enum: ['fixed', 'percentage'],
        required: true
    },
    status: {
        type: Boolean,
        required: true
    },
    maxAmount: {
        type: Number,
        required: true
    },
    minAmount: {
        type: Number,
        required: true,
        default:0
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
        type: ObjectId,
        ref: 'Categories',
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

module.exports = mongoose.model('coupons',coupon)