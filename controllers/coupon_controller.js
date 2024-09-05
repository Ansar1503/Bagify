const Coupons = require('../model/coupon_schema')

const loadCoupon =  async (req, res) => {
    try {
        const coupon = await Coupons.find()
        return res.render('coupons',{coupon})
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
        const {couponCode,discountPercentage,maxAmount,minAmount,usageLimit} = req.body

        const existCoupon = await Coupons.findOne({code:couponCode})

        if(existCoupon){
            return res.render('addCoupon',{error:"coupon already exist"})
        }

        const coupon = new Coupons({
            code:couponCode,
            discountPercentage,
            maxAmount,
            minAmount,
            usageLimit:usageLimit||Infinity
        })
        await coupon.save()

        return res.redirect('/admin/coupons')

    }catch(err){
        console.log(err.message)
        return res.send('Internal server Error')
    }
} 

const changeCouponStats = async(req,res)=>{
    try {
        const couponId = req.params.id
        const change = req.body.change=='block'?false : true
        const coupon = await Coupons.findByIdAndUpdate(couponId,{$set:{isActive:change}},{new:true,upsert:true})
        let status = coupon.isActive ? 'Activated' : 'Deactivated'
        return res.status(200).json({success:true,message:`coupon is ${status}`,coupon})
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({success:false,message:'Internal server error'})
    }
}

module.exports = {
    loadCoupon,
    loadAddCouponpage,
    addCoupon,
    changeCouponStats
};