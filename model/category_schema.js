const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    discountPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    startDate: {
        type: Date,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    description:{
        type:String,
        required:false,
    },
    status: {
        type: Boolean,
        default:true
    }
  },{ timestamps: true })

const categories = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    image:{
        type:String,
    },
    isListed:{
        type:Boolean,
        default:true,
        required:true
    },
    offer:offerSchema
})

categories.statics.updateExpiredOffers = async function() {
    const currentDate = new Date();
    await this.updateMany(
        { 'offer.expiryDate': { $lt: currentDate }, 'offer.status': true },
        { $set: { 'offer.status': false } }
    );
};

module.exports = mongoose.model('categories',categories)