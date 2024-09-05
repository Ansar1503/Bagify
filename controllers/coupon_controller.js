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

const addCoupon = async (req,res)=>{
    try {
        const {couponCode,couponDescription,couponDiscount,maxAmount,minAmount}= req.body
        if(!couponCode || !couponDescription || !couponDiscount || !maxAmount || !minAmount){
            return res.send('please fill all the fields')
        }
        const coupon = new Coupons({
            couponCode,
            couponDescription,
            couponDiscount,
            maxAmount,
            minAmount
        })
        await coupon.save()
        return res.redirect('/admin/coupons')

    }catch(err){
        console.log(err.message)
        return res.send('Internal server Error')
    }
} 

module.exports = {
    loadCoupon,
    loadAddCouponpage,
    addCoupon
};