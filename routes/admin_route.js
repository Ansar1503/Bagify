const express = require('express')
const adminRoute = express()
const multer = require('../config/multer')
const imageResizer = require('../config/sharp')



 // admin middlewares 
const admin_session = require('../middlewares/admin_session')
const admin_controller = require('../controllers/admin_controller')
const admin_customer_controller = require('../controllers/admin_customer_controller')
const categories_controller = require('../controllers/categories_controller')
const product_controller = require('../controllers/product_controller')
const order_controller = require('../controllers/order_controller')


// set view engine
adminRoute.set('view engine','ejs');
adminRoute.set('views','./views/admin');



adminRoute.get('/',admin_session.notLoggedin,admin_controller.loadlogin)
adminRoute.get('/dashboard',admin_session.isLoggedin,admin_controller.loadadminDashboard)
adminRoute.get('/logout',admin_controller.logout)

adminRoute.post('/',admin_controller.verifyLogin)


// customer page request
adminRoute.get('/customers',admin_session.isLoggedin,admin_customer_controller.loadCustomer)

adminRoute.post('/customers/block/:id',admin_session.isLoggedin,admin_customer_controller.blockCustomer) //block user
adminRoute.post('/customers/unblock/:id',admin_session.isLoggedin,admin_customer_controller.unblockCustomer)//unblock user



// request of products page
adminRoute.get('/products',admin_session.isLoggedin,product_controller.loadProducts);
adminRoute.get('/products/addproduct',admin_session.isLoggedin,product_controller.loadAddproduct);
adminRoute.get('/products/edit-product/:id',admin_session.isLoggedin,product_controller.loadEditProduct)
adminRoute.get('/productdetail/:id',admin_session.isLoggedin,product_controller.productdetail)
adminRoute.post('/products/edit-product',admin_session.isLoggedin,multer.product_upload.array("pro_images",3),imageResizer.multimageCrop,product_controller.editProduct)
adminRoute.post('/products/addproduct',admin_session.isLoggedin,multer.product_upload.array("pro_images",3),imageResizer.multimageCrop,product_controller.addProduct)
adminRoute.post('/products/deactivate-product/:id',admin_session.isLoggedin,product_controller.deactivateProduct)
adminRoute.post('/products/activate-product/:id',admin_session.isLoggedin,product_controller.activateProduct)

// categories
adminRoute.get('/category/',admin_session.isLoggedin,categories_controller.loadCategory);
adminRoute.get('/category/edit-category/:id',admin_session.isLoggedin,categories_controller.LoadeditCategory)
adminRoute.get('/category/add-category',admin_session.isLoggedin,categories_controller.LoadAddCategory)
adminRoute.post('/category/unlist-category/:id',admin_session.isLoggedin,categories_controller.unlistCategory)
adminRoute.post('/category/relist-categroy/:id',admin_session.isLoggedin,categories_controller.relistCategory)
adminRoute.post('/category/add-category',admin_session.isLoggedin,multer.category_upload.single('image'),imageResizer.singleimageCrop,categories_controller.addCategory)
adminRoute.post('/category/update-category/:id',admin_session.isLoggedin,multer.category_upload.single('image'),imageResizer.singleimageCrop,categories_controller.updateCategory)

// order managment
adminRoute.get('/orders',admin_session.isLoggedin,order_controller.orderList)
adminRoute.get('/orders/orderDetails/:id',admin_session.isLoggedin,order_controller.orderDetails)
adminRoute.patch('/orders/update-status',admin_session.isLoggedin,order_controller.updateOrderStatus)
adminRoute.get('/orders/returns',admin_session.isLoggedin,order_controller.returnList)
adminRoute.get('/orders/return-status-change',admin_session.isLoggedin,order_controller.returnStatusChange)


module.exports = adminRoute;
