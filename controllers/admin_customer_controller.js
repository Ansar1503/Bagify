const User = require('../model/user_schema')

const loadCustomer = async function(req, res) {
    const page = parseInt(req.query.page) || 1; 
    const limit = 10; 
    const skip = (page - 1) * limit;

    try {
        const totalUsers = await User.countDocuments(); 
        const userData = await User.find()
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalUsers / limit);

        res.render('customers', { users: userData, currentPage: page, totalPages });
    } catch (error) {
        console.log(error);
        res.status(500).send("server error");
    }
};


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