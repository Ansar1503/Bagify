const User = require('../model/user_schema')

const loadCustomer = async function(req,res){
    try {
        const userData = await User.find()
        res.render('customers',{users:userData})
    } catch (error) {
        console.log(error);
        res.status(500).send("server error")
    }
}

const blockCustomer = async function(req,res){
    try {
        await User.findByIdAndUpdate({_id:req.params.id},{$set:{block:true}});
        res.redirect('/admin/customers')
    } catch (error) {
        console.log(error);
        res.status(500).send("server error")
    }
}
const unblockCustomer = async function (req,res){
    try {
       await User.findByIdAndUpdate({_id:req.params.id},{$set:{block:false}}) 
       res.redirect('/admin/customers')
    } catch (error) {
        console.log(error);
        res.status(500).send("server error")
    }
}

module.exports = {
    loadCustomer,
    blockCustomer,
    unblockCustomer
}