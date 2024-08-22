const mongoose = require('mongoose')
const User = require('../model/user_schema')
const bcrypt = require('bcrypt')
const Products = require('../model/product_schema')
const Category = require('../model/category_schema')
const Cart = require('../model/cart_schema')
const AddressModel = require('../model/address_schema')
const orderModel = require('../model/order_schema')
const nodemailer = require('../config/nodemailer');



function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString(); 
}

const loadlogin = async function(req,res){
    try {
        res.render('login')
    } catch (error) {
        console.log(error);
        res.status(500).send("login page not loaded")
    }
}

const loadRegister = async function (req,res){
    try {
        res.render('registration')
    } catch (error) {
        console.log(error);
        res.status(500).send("registration rendering error")
    }
}

const loadHome = async function(req,res){
    try {
        const categories = await Category.find({isListed:true})
        const products = await Products.find({isActive:true}).populate('product_category').limit(6)
        res.render('home',{products,categories})
    } catch (error) {
        console.log(error);
        res.status(500).send("homepage loading error")
    }
}

const loadDashboard = async function(req,res){
    try {
        
        // const user = await User.findOne({
        //     $or: [
        //         { _id: req.session.user_id },
        //         { googleId: req.session.user_id },
        //     ]
        // });
       let query = {};
        if (mongoose.Types.ObjectId.isValid(req.session.user_id)) {
            query._id = req.session.user_id;
            
        } else {
            query.googleId = req.session.user_id;
        }


        const user = await User.findOne(query).populate('address')
        const orderData = await orderModel.find({user:req.session.user_id})
        
        return res.render('user_Dashboard',{user,orderData})
    } catch (error) {
        console.log(error);
        res.status(500).send("couldnot load dashboard")
    }
}


const loadForgotPassword = async function(req,res){
    try {
        res.render('forgot-password')
    } catch (error) {
        res.status(500).send('forgot page load error')
    }
}

const Logout = async function (req,res){
    try {
        req.session.destroy()
        res.redirect('/')
    } catch (error) {
        console.log(error);
        res.status(500).send("could not logout")
    }
}

const registerAuth = async function (req,res){
    try {
        const email = req.body.email
        const password = req.body.password;
        const passhash = await bcrypt.hash(password, 10);
        req.session.regitrationmail = email

        // Check if the email already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            if(!existingUser.isVerified){
                return res.render('otp-verification',{email,msg:'email already exists! verify your email'})
            }
            if(existingUser.isVerified){
                return res.render('login',{email,msg:'email already exists please login'})
            }
        }

        // Create and save the new user
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
            password: passhash
        })

        const otp = generateOtp()

        user.otp = otp
        user.otpexp = new Date(Date.now() + 5 * 60 * 1000); 

        await user.save();
        console.log("User saved to database");
       

        // nodemailer content
        const mailcontent = `<h1> Thank you for choosing SzucciBags</h1>
        <p>please click on the link below to activate your account or use the code below:</p>
        ${otp}`
        const mailsend = await nodemailer(req.body.email,mailcontent,otp)
        if(mailsend){
        // Respond with success
        res.render('otp-verification',{success: "Registration successful! now verify your mail", email:req.body.email})
        }

    } catch (error) {
        console.log("Error in registration",error.message);
        res.status(500).send("registration error contact admin")
    }
}

const verifyOtp = async function (req,res){
    try {
        const {email,otp} = req.body;
// console.log(email,otp);

     const userData = await User.findOne({ email: email });
    if(!userData){
       return  res.render('otp-verification',{fail:"no user with this email",email})
    }
    // console.log(userData.otpexp);
    // console.log(Date.now());
    if(userData.otp == otp && userData.otpexp>Date.now()){
        userData.otp=null;
        userData.otpexp=null
        userData.isVerified=true
        await userData.save()
       return  res.render('login',{success:"otp verification success You can now login"})
    }else if(userData.otpexp<Date.now()){
        userData.otp = null;
        userData.otpexp = null;
        await userData.save();
        return res.render('otp-verification',{email,fail:'otp expired',email})
    }else{
       return res.render('otp-verification',{email,fail:'invalid otp',email})
    }
    
    } catch (error) {
        console.log(error)
        res.status(500).send("user registration error")
    }
}

const verifyUser = async function(req,res){
    try {
        const{email,password} = req.body;
      const userData = await  User.findOne({email:email})
      if(userData){
        const pasmatch = await bcrypt.compare(password, userData.password)
        if(!pasmatch){
            res.render('login',{fail:"invalid password"})
          }else{
            if(userData.block){
                return res.render('login',{fail:'user is blocked'})
            }
                req.session.user_id = userData._id;
                return res.redirect('/')
            
          }
      }else{
        res.render('login',{fail:'invalid email'})
      }
    } catch (error) {
        console.log(error);
        res.status(500).send("user verification error")
    }
}

const googleAuth = async function(req,res){
    try {
        const {sub,name,email} = req.user._json
        const existUser = await User.findOne({googleId:sub})
        if(!existUser){
        const userdata = new User({
            name,
            email,
            googleId:sub,
            isVerified:true
        })
       const googleUser = await userdata.save()  
       req.session.user_id = googleUser._id
       return  res.redirect('/')
    }

   
    req.session.user_id = existUser._id
      return  res.redirect('/')
    } catch (error) {
       return res.status(500).send('google authentication failure')
    }
}
const loadproducts = async (req, res) => {
    try {
        const product = await Products.findOne({_id: req.params.id,isActive:true}).populate('product_category');
        const relatedProducts = await Products.find({product_category: product.product_category._id,isActive:true}).populate('product_category').limit(4);
        const cart = await Cart.findOne({ 'items.product': product._id }).exec(); 

        // console.log(product._id);
        // console.log(cart);

        return res.render('product_details', { product, relatedProducts, cart });
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Product details page error');
    }
};

const resendOtp = async(req,res)=>{
    try {
        const otp = generateOtp()
        const email = req.session.regitrationmail
        const user = await User.findOne({email})
        const mailcontent = `<h1> Thank you for choosing SzucciBags</h1>
        <p>please click on the link below to activate your account or use the code below:</p>
        ${otp}`

        user.otp=otp;
        user.otpexp=new Date(Date.now() + 5 * 60 * 1000); 
        await user.save()
        const sendmail = await nodemailer(email,mailcontent,otp)
        if(sendmail){
           return res.render('otp-verification',{success: "Registration successful! now verify your mail", email})
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('error sending otp')
    }
}
const loadShop = async (req, res) => {
    try {
        const { catId, minPrice, maxPrice, sort, page = 1, limit = 5 } = req.query; 

        let query = {isActive:true,};
        if (catId) {
            query.product_category = catId;
        }
        if (minPrice && maxPrice) {
            query.product_sale_price = { $gte: Number(minPrice), $lte: Number(maxPrice) };
        }

        let sortOption = {};
        switch (sort) {
            case 'price-asc':
                sortOption = { product_sale_price: 1 };
                break;
            case 'price-desc':
                sortOption = { product_sale_price: -1 };
                break;
            case 'new-arrivals':
                sortOption = { created_at: -1 };
                break;
            case 'name-asc':
                sortOption = { product_name: 1 };
                break;
            case 'name-desc':
                sortOption = { product_name: -1 };
                break;
            default:
                sortOption = {}; 
        }

        const totalProducts = await Products.countDocuments(query);
        const products = await Products.find(query).populate('product_category')
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const categories = await Category.find({isListed:true});

        const totalPages = Math.ceil(totalProducts / limit);

        res.render('shop', { products, categories, sort, minPrice, maxPrice, page, totalPages });
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Shop loading error");
    }
};



const checkoutaddAddress  =  async(req,res)=>{
    try {
        const {name,phone,alt_phone,Address,city,state,pincode}= req.body
        const addAddress = new AddressModel({
            fullname:name,
            mobile:phone,
            pincode,
            altMobile:alt_phone,
            state,
            city,
            Address
        })
       const savedAddress =  await addAddress.save()
        const user = await User.findById(req.params.user_id)
        user.address.push(savedAddress._id)
        await user.save()
        const order = await orderModel.findOne({user:user._id})
        if(order){
           return res.redirect(`/checkoutpage/${user._id}`)
        }
        res.redirect('/userDashboard')
    } catch (error) {
        console.log(error.message);
        res.status(500).send('address add error')        
    }
}
const addAddress  =  async(req,res)=>{
    try {
        const {name,phone,alt_phone,Address,city,state,pincode}= req.body
        const addAddress = new AddressModel({
            fullname:name,
            mobile:phone,
            pincode,
            altMobile:alt_phone,
            state,
            city,
            Address
        })
       const savedAddress =  await addAddress.save()
        const user = await User.findById(req.params.user_id)
        user.address.push(savedAddress._id)
        await user.save()
        
        res.redirect('/userDashboard')
    } catch (error) {
        console.log(error.message);
        res.status(500).send('address add error')        
    }
}

const checkoutupdateAddress = async(req,res)=>{
    const existingaddress = await AddressModel.findById(req.params.address_id)
    if(!existingaddress){
        console.log('no existing address');
    }
   
    try {

        const {name,phone,alt_phone,Address,city,state,pincode}=req.body
        await AddressModel.findByIdAndUpdate(req.params.address_id,{$set:{
            fullname:name,
            Address:Address,
            altMobile:alt_phone,
            city:city,
            mobile:phone,
            pincode:pincode,
            state:state
        }})

        const order = await orderModel.findOne({user:req.body.user_id})
        if(order){
           return res.redirect(`/checkoutpage/${order.user._id}`)
        }
        
        return res.redirect('/userDashboard')
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('address update  eroror')        
    }
}

const updateAddress = async(req,res)=>{
    const existingaddress = await AddressModel.findById(req.params.address_id)
    if(!existingaddress){
        console.log('no existing address');
    }
   
    try {

        const {name,phone,alt_phone,Address,city,state,pincode}=req.body
        await AddressModel.findByIdAndUpdate(req.params.address_id,{$set:{
            fullname:name,
            Address:Address,
            altMobile:alt_phone,
            city:city,
            mobile:phone,
            pincode:pincode,
            state:state
        }})

        
        
        return res.redirect('/userDashboard')
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('address update  eroror')        
    }
}

const deleteAdress = async (req,res)=>{
   
    try {
        await AddressModel.findByIdAndDelete(req.params.id)
        await User.findOneAndUpdate({address:req.params.id},{$pull:{address:req.params.id}})
        return res.redirect('/userDashboard')
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('address delete error')
    }
    
}

const loadCart = async (req, res) => {
    try {
        const user = req.session.user_id
        const cart = await Cart.findOne({ user }).populate([
            { path: 'user', populate: { path: 'address' } },
            { path: 'items.product' }
        ]);
        if(cart){
            const summary = calculateCartSummary(cart);
            cart.summary=summary
            await cart.save()
            return res.render('cart', { cart, summary });
        }
        return res.render('cart',{cart})
         
        
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('cart page loaded error');
    }
};

const addtoCart = async(req,res)=>{
    try {
        let  {ogprice,price,product}=req.body
        // console.log(req.body);
        // console.log(mongoose.Types.ObjectId.isValid(product));
        
        product = new mongoose.Types.ObjectId(product)
        // console.log(product);
        
        let cart = await Cart.findOne({user:req.session.user_id})
        if(!cart){
            cart = new Cart ({user:req.session.user_id,items:[]})
        }
        const existingcartItem = cart.items.findIndex(item => item.product.toString() === product.toString())
        if(existingcartItem == -1){
            cart.items.push({
                product,
                regularPrice:parseInt(ogprice),
                price:parseInt(price),
                quantity:1
            })
            
            
            const summary = calculateCartSummary(cart)
            cart.summary = summary
            // console.log(summary);
            
            await cart.save()
            console.log('item added to cart successfully');
        }
        if(!existingcartItem){
            console.log('item already exists');
        }
        return res.redirect('/cart')        
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('couldnot add to cart')
    }
}

const removeCartItem = async (req,res)=>{
    try {
        const itemId = new mongoose.Types.ObjectId(req.query.itemId)
         
       const cart = await Cart.findOneAndUpdate({'items._id':itemId},{$pull:{items:{_id:itemId}}},{new:true})

       if (!cart) {
        return res.status(404).json({ success: false, message: 'Item not found in cart' });
      }

      if(cart.items.length==0){
        await Cart.deleteOne({ _id: cart._id });
        console.log('cart deleted');
        return res.status(200).json({success:true,message:'cart removed successfully',isEmpty:true})
      }
      const summary = calculateCartSummary(cart) 
     
      return res.status(200).json({ success: true, message: 'Item removed successfully', cart , summary});
       
    } catch (error) {
        console.error(error.message);
    }
}

const increaseItem = async (req, res) => {
    try {
        const itemId = req.query.itemId;
        const maxQuantity = 5; 

        
        const cart = await Cart.findOne({ 'items._id': itemId }).populate('items.product');
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

       
        const item = cart.items.find(item => item._id.toString() === itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in cart items' });
        }

        
        if (item.quantity >= maxQuantity) {
            return res.status(400).json({ success: false, message: `Quantity cannot exceed ${maxQuantity}` });
        }

        
        const updatedCart = await Cart.findOneAndUpdate(
            { 'items._id': itemId },
            { $inc: { 'items.$.quantity': 1 } },
            { new: true }
        ).populate('items.product');
        
        if (!updatedCart) {
            return res.status(404).json({ success: false, message: 'Failed to update cart' });
        }

        const updatedItem = updatedCart.items.find(item => item._id.toString() === itemId);
        const summary = calculateCartSummary(updatedCart);
        updatedCart.summary = summary;
        await updatedCart.save();
        
        return res.json({ 
            success: true, 
            message: 'Quantity increased successfully',
            updatedQuantity: updatedItem.quantity,
            summary: summary
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


const getCartSummary = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    
        const summary = calculateCartSummary(cart);
        
        res.json(summary);
      } catch (error) {
        console.error('Error fetching cart summary:', error);
        res.status(500).json({ success: false, message: 'Server error' });
      }
};


function calculateCartSummary(cart) {
    let subtotal = 0;
    cart.items.forEach(item => {
        subtotal += item.price * item.quantity;
    });

    const deliveryCharges = 0; 
    const couponAmount = 0
    const total = subtotal + deliveryCharges - couponAmount;
    

    return {
        subtotal: subtotal.toFixed(2),
        deliveryCharges: deliveryCharges.toFixed(2),
        total: total.toFixed(2),
        couponDiscount:couponAmount.toFixed(2)
    };
}

const decreaseQuantity = async (req,res)=>{
    try {
        const itemId = req.query.itemId 
        const cart =  await Cart.findOneAndUpdate({'items._id':itemId},{$inc:{'items.$.quantity':-1}},{new:true})
        if(!cart){
            return res.status(404).json({ success: false, message: 'Item not found in the cart' })
           }

           const summary = calculateCartSummary(cart)
           cart.summary = summary
           await cart.save()

          
                      

           return res.json({ 
            success: true, 
            message: 'Quantity decreased successfully',
            updatedQuantity: cart.items.find(item => item._id.toString() === itemId).quantity,
            summary: summary
        });
    }catch(err){
        console.log(err);
        return res.status(500).json({success:false,message:'Internal server error'})
    }
}

const loadCheckout = async(req,res)=>{
    try {        
        const user_id = new mongoose.Types.ObjectId(req.params.user_id)
       
        const cartdata = await Cart.findOne({ user:user_id  })
                 .populate([
                    { path: 'user', populate: { path: 'address' } },
                    { path: 'items.product', populate: { path: 'product_category' } }
                 ]);
                // console.log(cartdata);
        
        let statesArray = [
            "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
            "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
            "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
            "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
        ];
        // console.log('cartsummary',cartdata.summary);
      
        // console.log(cartdata);
        // console.log(cartdata.items[0].product);
        
        
          return  res.render('checkout',{cartdata,statesArray})
        
    } catch (error) {
        console.error(error.message)
        return res.status(500).send('checkout page loaded error')
    }
}

const placeOrder = async (req,res)=>{
    try {
        const {addressId,paymentMethod,cartId} = req.body
    console.log(req.body);
    
    const address = await AddressModel.findOne({_id:addressId})
    const cart = await Cart.findOne({_id:cartId}).populate([{path:'items.product',populate:{path:'product_category'}}])

    if(!address || !cart){
        console.log('cart or address not found'); 
    }

    const orderItems = cart.items.map(item =>({
        product:item.product?._id,
        productName:item.product?.product_name,
        brandName:item.product?.product_brand,
        category:item.product?.product_category?._id,
        categoryName:item.product?.product_category?.name,
        quantity:item.quantity,
        price:item.price,
        regularPrice:item.regularPrice,
        images:item.product?.product_images,
    }))

    const orderdata =await new orderModel({
        items:orderItems,
        user:cart.user?._id,
        totalItems:cart.items.length,
        subTotalAmount:cart.summary?.subtotal,
        discountAmount:cart.summary?.couponDiscount,
        totalAmount:cart.summary?.total,
        orderDate:Date.now(),
        paymentMethod:paymentMethod,
        shippingAddress:address
    }).save()
    
    if(!orderdata){
       return res.status(404).send('Item not found!. please check the cart')
    }
    // update product as order placed
    for (const item of orderItems) {
        await Products.findByIdAndUpdate(item.product, {
            $inc: { product_quantity: -item.quantity }
        });
    }
    // delete cart
    const deleteCart = await Cart.findByIdAndDelete(cart._id)
    if(!deleteCart){
        console.log('cart is not deletd');
        
    }
    
    return res.render('ordercomplete',{orderdata})
    
    } catch (error) {
        console.log(error.message);
        
    }  
}

const cancelOrderItem = async(req,res)=>{
    try {
        
        console.log(req.body);
        const orderId = new mongoose.Types.ObjectId(req.body.orderId)
        const status  = req.body.itemOrderStatus
        const itemId = new mongoose.Types.ObjectId(req.body.itemId)
        
        const validStatuses = orderModel.schema.path('orderStatus').enumValues
        console.log(validStatuses);
        

        if(!validStatuses.includes(status)){
            return res.status(400).json({error:'invalid order status'})
        }

        let updatedProductStatus

        if(status==="pending"||status==="shipped"){
 
            updatedProductStatus = await orderModel.updateOne(
                { _id: orderId, "items._id": itemId },
                { $set: { "items.$.itemOrderStatus": "cancelled" } }
              );
              
            
            if(updatedProductStatus.modifiedCount>0){
                const itemData = await orderModel.aggregate([
                    { $match: { _id: orderId} },
                    { $unwind: "$items"},
                    { $match:{ "items._id":itemId}},
                    { $project:{_id:0,quantity:"$items.quantity",productId:"$items.product"}}
                ]);

                const orderData = await orderModel.findById(orderId)
                const anyNotDelivered = orderData.items.some(item=>item.itemOrderStatus != "delivered")
                const allcancelled = orderData.items.every(item=>item.itemOrderStatus === "cancelled")

                let allOrdercancelled;
                if(anyNotDelivered&&allcancelled){
                    allOrdercancelled = await orderModel.updateOne({_id:orderId},{$set:{orderStatus:"cancelled"}})
                }

                // update quantity of the product
                const {quantity, productId}= itemData[0] || {}

                const updatedQuantity = await Products.findByIdAndUpdate(
                    productId,
                    { $inc: { product_quantity: quantity } },
                    { new: true }
                  );
                  

                if(updatedQuantity){
                    return res.status(200).json({success:true,message:'product stock reupdated successfully',updatedProductStatus,returnStatus:false,allOrderCancelled:allOrdercancelled})
                }
                
            }

        }else if(orderProductStatus==="delivered"){

            return res.status(200).json({message:"Product already delivered , return only",returnStatus:true})
    
           }   

           return res.status(400).json({ error:"cannot change status",success:false }); 
        
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({success:false,message:'internal server error'})     
    }
}

const edituserPersonal = async(req,res)=>{
    // console.log(req.body);
    
    const {name,mobile} = req.body
    if(!name || !mobile){
        return res.status(400).json({success:false,message:'please enter the required fields'})
    }
    const user = await User.findOne({_id:req.session.user_id});
    if(!user){
        return res.status(400).json({success:false,message:'user not found please login'})
    }

    try {
    
    user.name = name
    user.mobile = mobile
    const userData = await user.save()
    return res.status(200).json({success:true,message:'user name changed successfully',user:userData})   
    
    } catch (error) {
        return res.status(500).json({success:false,message:'server error'})
    }

}

const dashboardOtpVerify = async(req,res)=>{
    const {email,otp} = req.body
    if(!req.body){
        return res.status(400).json({success:false,message:'please provide the credentials'})
    }
    const user = User.findOne({email})
    if(!user){
        return res.status(400).json({success:false,message:'Invalid email'})
    }
    if(user.otp == otp && user.otpexp>Date.now()){
        user.otp = null
        user.otpexp = null
        const userData = await user.save()
        return res.status(200).json({success:true,message:'otp verified successfully',user:userData})
    }
    if(user.otp != otp){
        return res.status(400).json({success:false,message:'invalid otp'})
    }
    if(user.otpexp < Date.now()){
       return res.status(400).json({success:false,message:'otp expired'}) 
    }
}

const editUserEmail = async(req,res)=>{
    if(!req.body){
        return res.status(400).json({success:false,message:'please provide the credentials'})
    }
}

module.exports = {
    loadlogin,
    loadRegister,
    registerAuth,
    verifyOtp,
    verifyUser,
    loadHome,
    loadDashboard,
    Logout,
    loadForgotPassword,
    googleAuth,
    loadproducts,
    resendOtp,
    loadShop,
    addAddress,
    updateAddress,
    deleteAdress,
    addtoCart,
    loadCart,
    removeCartItem,
    increaseItem,
    decreaseQuantity,
    loadCheckout,
    placeOrder,
    getCartSummary,
    checkoutaddAddress,
    checkoutupdateAddress,
    cancelOrderItem,
    edituserPersonal,
    dashboardOtpVerify,
    editUserEmail
}