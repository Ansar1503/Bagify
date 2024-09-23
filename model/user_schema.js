const mongoose = require("mongoose");

const user_schema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    mobile:{
        type:String,
        required:false,
        unique:true,
        default:null
    },
    password:{
        type:String,
        required:false
    },
    block:{
        type:Boolean,
        default:false
    },
    googleId:{
        type:String,
        unique:true
    },
    address:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'address'
    }],
    // Review:{
    //     type:mongoose.Schema.Types.ObjectId,
    //     ref:'reviews',
    //     required:true
    // },
    isVerified:{
        type:Boolean,
        default:false
    },
    otp:{
     type:String
    }
        ,
    otpexp:{
        type:Date
        
    },
 
},{timestamps:true})


module.exports = mongoose.model('userdatas',user_schema)