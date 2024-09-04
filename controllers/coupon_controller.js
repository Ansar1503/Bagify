const Coupons = require('../model/coupon_schema')

const loadCoupon =  async (req, res) => {
    try {
        // const coupon = await Coupons.find()
        return res.render('coupons',{couponsData:false})
    } catch (error) {
        console.log(error.message);
        return res.send('Internal server Error')      
    }
}

const loadAddCouponpage = async (req,res)=>{
    try {
        return res.render('addCoupon')
    } catch (error) {
        console.log(error.message)
        return res.send('Internal   server Error')

    }
}

module.exports = {
    loadCoupon,
    loadAddCouponpage
};