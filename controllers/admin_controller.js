const Admin = require('../model/admin_schema')
const { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, differenceInDays, subMonths } = require('date-fns');
const Order = require('../model/order_schema');
const Products = require('../model/product_schema')
const Category = require('../model/category_schema')
const User = require('../model/user_schema')
const {getSalesReport} = require('../controllers/sales_controller')

const loadlogin = async function(req,res){
    try {
        res.render('login')
    } catch (error) {
        console.log(error);
        res.status(500).send("server error")
    }
}

const loadadminDashboard = async function (req, res) {
    try {
        const orderData = await Order.find();
        const orderCount = orderData.length;
        const totalRevenue = orderData.reduce((total, order) => total + order.totalAmount, 0);
        const productCount = await Products.countDocuments()
        const categoryCount = await Category.countDocuments();
        const userCount = await User.countDocuments();

        let bestSellingProductsIds = await Order.aggregate([{$unwind: '$items'},
            {$match:{'items.itemOrderStatus': 'delivered'}},
            {$group:{_id: '$items.product',totalSold:{$sum:'$items.quantity'}}},
            {$sort:{totalSold:-1}},{$limit:10}]);
            // console.log(bestSellingProductsIds)
        bestSellingProductsIds  =  bestSellingProductsIds.map(product=>product._id)
            // console.log(bestSellingProductsIds)
        const bestSellingProducts = await Products.find({_id:{$in:bestSellingProductsIds}})
        const sortedProducts = bestSellingProductsIds.map(id =>
            bestSellingProducts.find(product => product._id.equals(id))
        );
        // console.log(bestSellingProducts)
        let bestCategoryIds = bestSellingProducts.map(product=>product.product_category.toString())
        bestCategoryIds = [...new Set(bestCategoryIds)]
        const bestCategories = await Category.find({_id:{$in:bestCategoryIds}})
        
        const daily = {
            start: startOfDay(new Date()),
            end: endOfDay(new Date())
        };
        const weekly = {
            start: startOfWeek(new Date()),
            end: endOfWeek(new Date())
        };
        const monthly = {
            start: startOfMonth(new Date()),
            end: endOfMonth(new Date())
        };

        const dailyRevenue = orderData
            .filter(order => order.createdAt >= daily.start && order.createdAt <= daily.end)
            .reduce((total, order) => total + order.totalAmount, 0);

        const weeklyRevenue = orderData
            .filter(order => order.createdAt >= weekly.start && order.createdAt <= weekly.end)
            .reduce((total, order) => total + order.totalAmount, 0);

        const monthlyRevenue = orderData
            .filter(order => order.createdAt >= monthly.start && order.createdAt <= monthly.end)
            .reduce((total, order) => total + order.totalAmount, 0);

        res.render('admin_Dashboard', {
            orderCount,
            totalRevenue,
            productCount,
            categoryCount,
            userCount,
            dailyRevenue,
            weeklyRevenue,
            monthlyRevenue,
            bestSellingProducts:sortedProducts,
            bestCategories
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("server error");
    }
};
const getAdminReport = async function(req,res){
    try {
        const { startDate, endDate, period } = req.query;
        if(startDate,endDate,period){
            const reportData = await getSalesReport(startDate, endDate, period);
            if(reportData){
                // console.log(reportData)
             return res.json({success:true,reportData})
            }
        } 
    } catch (error) {
        console.error(error)
        return res.status(500).json({success:false,message:'Internal server error'})
    }
}

const  logout = async function(req,res){
    try {
        req.session.destroy()
        res.redirect('/admin/')
    } catch (error) {
        console.log(error);
        res.status(500).send("server error")
    }
}


const verifyLogin = async function (req,res){
    try {
        const {email,password} = req.body
        const adminData = await Admin.findOne({email:email});
        if(password != adminData.password){
            res.render('login',{invalidpass:'invalid password'})
        }else if(adminData.isAdmin){
            req.session.admin_id = adminData._id
            res.redirect('/admin/dashboard')
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("server error")
    }
}






module.exports = {
    loadlogin,
    verifyLogin,
    loadadminDashboard,
    logout,
    getAdminReport,
}