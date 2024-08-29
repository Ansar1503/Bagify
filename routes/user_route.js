const express = require('express');
const passport = require('../config/passport')
const multer = require('multer')
const upload = multer()
// user middles
const userController = require('../controllers/user_controller')
const userAuth = require('../middlewares/user_session');

// express
const userRoute = express()

// set view engine
userRoute.set('view engine','ejs');
userRoute.set('views','./views/user');
// ,userAuth.isLoggedin

// GET requests
userRoute.get('/',userController.loadHome)
userRoute.get('/register',userAuth.notLoggedin,userController.loadRegister)
userRoute.get('/login',userAuth.notLoggedin,userController.loadlogin)
userRoute.get('/userDashboard',userAuth.isLoggedin,userController.loadDashboard)
userRoute.get('/logout',userAuth.isLoggedin,userController.Logout)
userRoute.get('/forgot',userAuth.notLoggedin,userController.loadForgotPassword)
userRoute.get('/product-details/:id',userController.loadproducts)
userRoute.get('/resendOtp',userController.resendOtp)
userRoute.get('/shop',userController.loadShop)
userRoute.get('/delete-address/:id',userAuth.isLoggedin,userController.deleteAdress)
// userRoute.get('/edit-address',userAuth.isLoggedin,userController.loadEditAddress)


// forgot
userRoute.post('/forgot/send-otp',userAuth.notLoggedin,userController.forgotSendOtp)
userRoute.patch('/forgot/verifyOtpAndChangePassword',userAuth.notLoggedin,userController.fogotPassAndChangePassword)


// POST requests
userRoute.post('/login',userController.verifyUser)
userRoute.post('/register',userController.registerAuth)
userRoute.post('/verify-otp',userController.verifyOtp)
userRoute.post('/add-address/:user_id',userAuth.isLoggedin,userController.addAddress)
userRoute.post('/update-address/:address_id',userAuth.isLoggedin,userController.updateAddress)


// cart
userRoute.get('/cart',userAuth.isLoggedin,userController.loadCart)
userRoute.get('/get-cart-summary',userAuth.isLoggedin,userController.getCartSummary)
userRoute.post('/addtoCart',userAuth.isLoggedin,userController.addtoCart)
userRoute.patch('/increase-quantity',userAuth.isLoggedin,userController.increaseItem)
userRoute.patch('/decrease-quantity',userAuth.isLoggedin,userController.decreaseQuantity)
userRoute.delete('/removeItem',userAuth.isLoggedin,userController.removeCartItem)

// order
userRoute.get('/checkoutpage/:user_id',userAuth.isLoggedin,userController.loadCheckout)
userRoute.post('/placeOrder',userAuth.isLoggedin,userController.placeOrder)
userRoute.post('/checkout/add-address/:user_id',userAuth.isLoggedin,userController.checkoutaddAddress)
userRoute.post('/checkout/update-address/:address_id',userAuth.isLoggedin,userController.checkoutupdateAddress)
userRoute.patch('/orders/cancelItem',userAuth.isLoggedin,userController.cancelOrderItem)
userRoute.patch('/orders/returnOrder',userAuth.isLoggedin,userController.returnOrder)

//dashbord profile
userRoute.patch('/userDashboard/updatePersonal',upload.none(),userAuth.isLoggedin,userController.edituserPersonal) 
userRoute.patch('/userDashboard/changeEmail',upload.none(),userAuth.isLoggedin,userController.editUserEmail)
userRoute.patch('/userDashboard/changePassword',upload.none(),userAuth.isLoggedin,userController.changepassword)
userRoute.post('/userDashboard/verifyOtpAndChangePassword',userAuth.isLoggedin,userController.verifyOtpAndChangePassword)
userRoute.post('/userDashboard/verifyOtpAndChangeEmail',userAuth.isLoggedin,userController.verifyOtpAndChangeEmail)

// Razorpay
userRoute.post('/razorpay/createOrder',userAuth.isLoggedin,userController.createOrder)
userRoute.post('/razorpay/verify-payment',userAuth.isLoggedin,userController.verifyOrder)

// wallet
userRoute.post('/wallet/handledPayment',userAuth.isLoggedin,userController.handledPayment)

// google authentication
userRoute.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email','https://www.googleapis.com/auth/user.phonenumbers.read'] }))
userRoute.get('/auth/google/callback',passport.authenticate('google',{successRedirect:"/auth/protected",failureRedirect:"/"}))  
userRoute.get('/auth/protected',userController.googleAuth)


module.exports = userRoute;