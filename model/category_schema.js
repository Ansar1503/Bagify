const mongoose = require('mongoose');

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
    }

})

module.exports = mongoose.model('categories',categories)