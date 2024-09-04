const {Schema,model}=require('mongoose')
const ObjectId = Schema.Types.ObjectId

const wishlist = new Schema({
    user:{
        type:ObjectId,
        ref:'userdatas',
        required:true
    },
    products:[
        {
            type:ObjectId,
            ref:'products',
        }
    ]
},{timestamps:true})

module.exports = model('wishlists',wishlist)