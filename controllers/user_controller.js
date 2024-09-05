const mongoose = require('mongoose')
const User = require('../model/user_schema')
const bcrypt = require('bcrypt')
const Products = require('../model/product_schema')
const Category = require('../model/category_schema')
const Cart = require('../model/cart_schema')
const AddressModel = require('../model/address_schema')
const orderModel = require('../model/order_schema')
const nodemailer = require('../config/nodemailer');
const Return = require('../model/order_return_Schema')
const Wallet = require('../model/wallet_schema')
const Wishlist = require('../model/wishlist_schema')
const Razorpay = require('../config/Razorpay')
require('dotenv').config()


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

        const wallet = await Wallet.findOne({user:req.session.user_id})
        

        const user = await User.findOne(query).populate('address')
        const orderData = await orderModel.find({user:req.session.user_id})
        
        return res.render('user_Dashboard',{user,orderData,wallet})
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

 
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            if(!existingUser.isVerified){
                return res.render('otp-verification',{email,msg:'email already exists! verify your email'})
            }
            if(existingUser.isVerified){
                return res.render('login',{email,msg:'email already exists please login'})
            }
        }

      
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
       

        const mailcontent = `<h1> Thank you for choosing SzucciBags</h1>
        <p>please click on the link below to activate your account or use the code below:</p>
        ${otp}`
        const mailsend = await nodemailer(req.body.email,mailcontent,otp)
        if(mailsend){
       
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
const googleAuth = async function(req, res) {
    try {
        // console.log('Full req.user object:', JSON.stringify(req.user, null, 2));
        console.log(req.user);
        
        const { id, displayName, emails, phoneNumbers } = req.user;
        const email = emails && emails.length > 0 ? emails[0].value : null;
        const mobile = phoneNumbers && phoneNumbers.length > 0 ? phoneNumbers[0].value : null;
        
        // console.log('ID:', id);
        // console.log('Display Name:', displayName);
        // console.log('Email:', email);
        // console.log('Phone number:', mobile);
       
        const existingUser = await User.findOne({ googleId: id });

        if (!existingUser) {
          
            const newUser = new User({
                name: displayName,
                email,
                googleId: id,
                isVerified: true 
            });
            const savedUser = await newUser.save();
            
            req.session.user_id = savedUser._id;
        } else {
           
            req.session.user_id = existingUser._id;
        }

        
        return res.redirect('/');
    } catch (error) {
        console.error('Google authentication failure:', error);
        return res.status(500).send('Google authentication failure');
    }
};


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
        const page = parseInt(req.query.page) || 1;
        const limit = 6;
        const skip = (page - 1) * limit;
        
        let query = {};
        
        if (req.query.prev) {
            
            query = JSON.parse(req.query.prev);
        }
        
        if (req.query.categories) {
            const categories = Array.isArray(req.query.categories) ? req.query.categories : [req.query.categories];
            query.product_category = { $in: categories };
        }
        
        if (req.query.inStock === 'true' && req.query.outOfStock !== 'true') {
            query.product_quantity = { $gt: 0 };
        } else if (req.query.outOfStock === 'true' && req.query.inStock !== 'true') {
            query.product_quantity = 0;
        }
        
        let sort = {};
        switch (req.query.sort) {
            case 'price-asc':
                sort = { product_sale_price: 1 };
                break;
            case 'price-desc':
                sort = { product_sale_price: -1 };
                break;
            case 'name-asc':
                sort = { product_name: 1 };
                break;
            case 'name-desc':
                sort = { product_name: -1 };
                break;
            case 'newest':
                sort = { createdAt: -1 };
                break;
            case 'popularity':
                sort = { sales_count: -1 };
                break;
            case 'rating':
                sort = { rating: -1 };
                break;
            case 'discount':
                sort = { discount_percentage: -1 };
                break;
            default:
                sort = { createdAt: -1 };
        }
        
        const products = await Products.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('product_category');
        
        const totalProducts = await Products.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);
        
        const categories = await Category.find();
        const wishlist = await Wishlist.findOne({user:req.session.user_id})
        res.render('shop', {
            wishlist,
            products,
            page,
            totalPages,
            categories,
            currentFilters: req.query,
            query: JSON.stringify(query) 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
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
        
        const wallet = await Wallet.findOne({user:user_id})
        
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
        
        
          return  res.render('checkout',{cartdata,statesArray,wallet})
        
    } catch (error) {
        console.error(error.message)
        return res.status(500).send('checkout page loaded error')
    }
}

const placeOrder = async (req,res)=>{
    try {
        const {addressId,paymentMethod,cartId} = req.body
        const paymentId = req.body.paymentId || null
        
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
        itemOrderStatus:'confirmed',
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
        orderStatus:'confirmed',
        onlinePaymentId:paymentId,
        paymentMethod:paymentMethod,
        paymentStatus:paymentMethod == 'razorpay'|| paymentMethod == 'wallet'? 'completed' : 'pending',
        shippingAddress:address
    }).save()
    
    if(paymentMethod == 'wallet'){
        const wallet = await  Wallet.findOne({user:cart.user})
     if(!wallet){
         return res.send('Wallet not found check your wallet')
      }
      if(wallet.balance<cart.summary.total){
          return res.send('Insufficient balance')
      } 
      const transaction = {
        orderId:orderdata._id,
        amount:cart.summary.total,
        status:'success',
        type:'debit',
        razorpaymentId:orderdata.paymentId || orderdata._id
    }
    if(wallet){
        wallet.transactions.push(transaction)
        wallet.balance-=transaction.amount
        await wallet.save()
    }
    if(!wallet){
        await  new Wallet({
            user:cart.user,
            balance:transaction.amount,
            transactions:[transaction]
        }).save()
    }
    } 
   
   
    if(!orderdata){
       return res.status(404).send('Item not found!. please check the cart')
    }
    
    for (const item of orderItems) {
        await Products.findByIdAndUpdate(item.product, {
            $inc: { product_quantity: -item.quantity }
        });
    }
    
    const deleteCart = await Cart.findByIdAndDelete(cart._id)
    if(!deleteCart){
        console.log('cart is not deleted');
        
    }
    
    return res.render('ordercomplete',{orderdata})
    
    } catch (error) {
        console.log(error.message);
        
    }  
}

const cancelOrderItem = async (req, res) => {
    try {
        const reason = req.body.cancellationReason;
        const orderId = new mongoose.Types.ObjectId(req.body.orderId);
        const status = req.body.itemOrderStatus;
        const itemId = new mongoose.Types.ObjectId(req.body.itemId);

        const validStatuses = orderModel.schema.path('orderStatus').enumValues;

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid order status' });
        }

        let updatedProductStatus;

        if (status === "pending" || status == "confirmed") {

            
            updatedProductStatus = await orderModel.updateOne(
                { _id: orderId, "items._id": itemId },
                { $set: { "items.$.itemOrderStatus": "cancelled", "items.$.cancellationReason": reason } }
            );
            

            if (updatedProductStatus.modifiedCount > 0) {
                const itemData = await orderModel.aggregate([
                    { $match: { _id: orderId } },
                    { $unwind: "$items" },
                    { $match: { "items._id": itemId } },
                    { $project: { _id: 0, quantity: "$items.quantity", productId: "$items.product" } }
                ]);

                if (!itemData.length) {
                    return res.status(404).json({ error: 'Item not found in the order' });
                }

                const orderData = await orderModel.findOne({"items._id":itemId});
                const wallet = await Wallet.findOne({user:orderData.user})

                if(orderData.paymentMethod == "razorpay" ||  orderData.paymentMethod == "wallet"){

                    const transaction = {
                        orderId:orderId,
                        amount:orderData.items[0].price,
                        status:'success',
                        type:'credit',
                        razorpaymentId:orderData.onlinePaymentId || orderId.toString()
                    }
                    if(wallet){ 
                        wallet.transactions.push(transaction)
                        wallet.balance += transaction.amount
                        await wallet.save()
                    }
                    if(!wallet){
                        await new Wallet({
                            user:orderData.user,
                            balance:transaction.amount,
                            transactions:[transaction]
                        }).save()
                    }
                }

                const anyNotDelivered = orderData.items.some(item => item.itemOrderStatus !== "delivered");
                const allCancelled = orderData.items.every(item => item.itemOrderStatus === "cancelled");
                let allOrderCancelled;
                if (anyNotDelivered && allCancelled) {
                    allOrderCancelled = await orderModel.updateOne({ _id: orderId }, { $set: { orderStatus: "cancelled" } });
                }

                const { quantity, productId } = itemData[0] || {};

                if (!productId) {
                    return res.status(404).json({ error: 'Product not found' });
                }

                const updatedQuantity = await Products.findByIdAndUpdate(
                    productId,
                    { $inc: { product_quantity: quantity } },
                    { new: true }
                );

                if (updatedQuantity) {
                    return res.status(200).json({
                        success: true,
                        message: 'Product stock updated successfully',
                        updatedProductStatus,
                        returnStatus: false,
                        allOrderCancelled: allOrderCancelled ? true : false
                    });
                }
            } else {
                return res.status(400).json({ error: 'Failed to update product status' });
            }
        } else if (status === "delivered") {
            return res.status(200).json({ message: "Product already delivered, return only", returnStatus: true });
        } else {
            return res.status(400).json({ error: "Invalid status provided", success: false });
        }
    } catch (error) {
        console.error('Error in cancelOrderItem:', error); // Improved logging
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


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
const verifyOtpAndChangeEmail = async (req, res) => {
    const { email, otp, newEmail } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Please provide both email and OTP.' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid email.' });
        }

        if (user.otp === otp && user.otpexp > Date.now()) {
            user.otp = null;
            user.otpexp = null;
            user.email = newEmail;
            const userData = await user.save();
            return res.status(200).json({ success: true, message: 'OTP verified successfully', user: userData });
        } else if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP.' });
        } else if (user.otpexp < Date.now()) {
            return res.status(400).json({ success: false, message: 'OTP expired.' });
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

const editUserEmail = async (req, res) => {
    if (!req.body || !req.body.newEmail || !req.body.confirmNewEmail) {
        return res.status(400).json({ success: false, message: 'Please provide the new email address' });
    }
    const { newEmail, confirmNewEmail } = req.body;

    if (newEmail !== confirmNewEmail) {
        return res.status(400).json({ success: false, message: 'Emails do not match' });
    }

    const existingEmail = await User.findOne({ email: newEmail });
    if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email already exists. Please enter another email.' });
    }

    try {
        const otp = generateOtp();
        const mailContent = `
            <h1>Changing Email</h1>
            <p>Please use the following code to verify your new email address:</p>
            <p><strong>${otp}</strong></p>`;

        const sendMailSuccess = await nodemailer(newEmail, mailContent, otp);
        if (!sendMailSuccess) {
            return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again later.' });
        }

        const user = await User.findById(req.session.user_id);
        if (!user) {
            return res.status(400).json({ success: false, message: 'No user found. Please log in again.' });
        }
        
        user.otp = otp;
        user.otpexp = new Date(Date.now() + 5 * 60 * 1000);
        const userData = await user.save();

        return res.status(200).json({ success: true, message: 'OTP sent successfully. Please check your email.', user: userData, newEmail });

    } catch (error) {
        console.error('Error in editUserEmail:', error);
        return res.status(500).json({ success: false, message: 'Internal server error. Please try again later.' });
    }
};


const changepassword = async(req,res)=>{
    if(!req.body){
        return res.status(400).json({success:false,message:'Please enter some credentials'})
    }
    
    const {currentPass,newPass,confirmNewPass} = req.body
    if(newPass!=confirmNewPass){
        return res.status(400).json({success:false,message:'confirm password is not same as new password'})
    }
    const user = await User.findById(req.session.user_id)
    if(!user){
        return res.status(400).json({success:false,message:'no user found please login'})
    }
    const passmatch = await bcrypt.compare(currentPass,user.password)
    if(!passmatch){
        return res.status(400).json({success:false,message:'Invalid password'})
    }
    try {
        const otp = generateOtp()
        const mailcontent = `<h1>Requested to change password</h1>
        <p>please confirm mail!  use the code below:</p>
        ${otp}`
        const sendmail = await nodemailer(user.email,mailcontent,otp)
        if(!sendmail){
            return res.status(400).json({success:false,message:'mail send failed please provide check your mail'})
        }
        user.otp = otp
        user.otpexp = new Date(Date.now() + 5 * 60 * 1000);
        const newpass = await bcrypt.hash(newPass,10)
        const userData = await user.save()

        return res.status(200).json({success:true,message:'Success! please verify your mail now',user:userData,newpass})
    } catch (error) {
        return res.status(500).json({success:false,message:'Internal server error'})
    }

}
const verifyOtpAndChangePassword = async(req,res)=>{
    if(!req.body){
        return res.status(400).json({success:false,message:'please enter the credentials'})
    }
    const {otp,newpass,email} = req.body

    const user= await User.findOne({email})
    if(!user){
        return res.status(400).json({success:false,message:'couldnt find the user try logging in again'})
    }
    try {
        if(user.otp == otp && user.otpexp>Date.now()){
            user.otp = null;
            user.otpexp = null;
            user.password = newpass;
            await user.save()
        }else if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP.' });
        } else if (user.otpexp < Date.now()) {
            return res.status(400).json({ success: false, message: 'OTP expired.' });
        }

        return res.status(200).json({success:true,message:'otp verified successfully! password changed'})
    } catch (error) {
        return res.status(500).json({success:false,message:'Internal server error'})
    }
}
const forgotSendOtp = async (req, res) => {
    try {
        // console.log(req.body);
        const { email, newpass, currentpass, confirmPass } = req.body;
        
    
        if (!email || !newpass || !currentpass || !confirmPass) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

 
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'No user found with this email.' });
        }

        
        const passmatch = await bcrypt.compare(currentpass, user.password);
        if (!passmatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        }

        if (newpass === currentpass) {
            return res.status(400).json({ success: false, message: 'New password must be different from the current password.' });
        }

        
        const newPassMatch = await bcrypt.compare(newpass, user.password);
        if (newPassMatch) {
            return res.status(400).json({ success: false, message: 'New password cannot be the same as the old password.' });
        }

        const otp = generateOtp();
        const mailContent = `
            <h1>Password Reset Request</h1>
            <p>Please use the following code to verify your request:</p>
            <p><strong>${otp}</strong></p>
        `;
        
        const sendmail = await nodemailer(user.email, mailContent, otp);
        console.log('mail send');
        
        if (!sendmail) {
            return res.status(500).json({ success: false, message: 'Failed to send email. Please try again.' });
        }

        user.otp = otp;
        user.otpexp = new Date(Date.now() + 5 * 60 * 1000); 
        const hashpass = await bcrypt.hash(newpass,10)
        await user.save();

        return res.status(200).json({ success: true, message: 'OTP sent. Please check your email.', hashpass });

    } catch (error) {
        console.error('Error in forgotSendOtp:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};
const  fogotPassAndChangePassword =async(req,res)=>{
    try {
        const {email,otp,newpass} = req.body
        // console.log(req.body)
        const user =await User.findOne({email})
        if(!user){
            return res.status(400).json({success:false,message:'no user found with this email'})
        }

        
        if(user.otp == otp && user.otpexp>Date.now()){
     
            
            user.otp = null;
            user.otpexp = null;
            user.password = newpass;
            await user.save()
            return res.status(200).json({success:true,message:'otp verified successfully! password changed'})
        }else if (user.otp !== otp) {
        
            
            
            return res.status(400).json({ success: false, message: 'Invalid OTP.' });
        } else if (user.otpexp < Date.now()) {            
            return res.status(400).json({ success: false, message: 'OTP expired.' });
        }

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({success:false,message:'Internal server error.'})        
    }
}

const returnOrder  = async(req,res)=>{
    try {
        
        const {itemId,orderStatus,reason} = req.body
        if(!itemId || !orderStatus || !reason){
            return res.status(400).json({success:false,message:'Please fill all fields'})
        }
        const itemObjectId = new mongoose.Types.ObjectId(itemId)
        const returnExists = await  Return.findOne({itemId:itemObjectId})
        if(returnExists){
            return res.status(400).json({success:false,message:'return request already exists.'})
        }

        const  order = await orderModel.findOne({"items._id":itemObjectId})
        const item = order.items.find(item => item._id.toString() === itemObjectId.toString());
        
        
        if(!order){
        return res.status(404).json({success:false,message:'order not found'})
        }           
     
        
        if(Date.now() > item.deliveredDate){
            return res.status(400).json({success:false,message:'Return time over'})
        }
        
         
        if(!orderStatus=='delivered'){
            return res.status(400).json({success:false,message:'Item is not delivered'})
        }
        if(orderStatus=='cancelled'){
            return res.status(400).json({status:false,message:'item is cancelled'})
        }
        
        const returnOrder = new Return({
            order:order._id,
            orderItemId:item._id,
            product:item.product,
            productRefundAmount:item.price,
            productReturnDate:Date.now(),
            productReturnReason:reason,
        })
        const  savedReturnOrder = await returnOrder.save()
        item.itemOrderStatus = savedReturnOrder.returnProductStatus
        await  order.save()
        return res.status(200).json({success:true,message:'return has been Initiated'})
        
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({success:false,message:'Internal server error'})  
    }
}


const createOrder = async (req, res) => {
    try {
      const { userId, amount } = req.body;
      if (!userId || !amount) {
        return res.status(400).json({ success: false, message: 'Please provide userId and amount.' });
      }
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const key =  process.env.RZP_key_ID
      
      const order = await Razorpay.createOrder(amount, `receipt_${userObjectId}`);

      return res.status(200).json({
        success: true,
        message: 'Wallet money added successfully.',
        order,
        key 
      });
    } catch (error) {
      console.error('Error:', error.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  
  const verifyOrder = async (req, res) => {
    try {
        const{order_id,payment_id,signature}=req.body
        if(!order_id ||  !payment_id || !signature){
            return res.status(400).json({success:false,message:'Invalid request'})
        }
        const verifiedPaymentSignature = await  Razorpay.verifyPaymentSignature(order_id, payment_id, signature);
        if(!verifiedPaymentSignature){
            return res.status(400).json({success:false,message:'verification  failed'})
        }
        return res.status(200).json({success:true,message:'payment verification success',sign:verifiedPaymentSignature})

    } catch (error) {
        console.error('Error',error.message)
        return res.status(500).json({success:false,message:'internal server error'})
    }
  }

  const  handledPayment = async (req, res) => {
    try {
        const {amount,userId,razorpayOrderId,razorpaymentId,success} = req.body
        console.log(req.body)
        if (!amount || !userId || !razorpayOrderId || !razorpaymentId) {
            return res.status(400).json({ success: false, message: 'Invalid request data' });
        }
       
        
        const userObjectId = new mongoose.Types.ObjectId(userId)
        const wallet = await Wallet.findOne({user:userObjectId})
        if(!success){
         const transaction = {
            amount:amount/100,
            type:'credit',
            status:'failed',
            razorpaymentId,
        }
         if(!wallet){
            const newWallet = new Wallet({
                user:userObjectId,
                transactions:[transaction]
            })
            await newWallet.save()
            return res.status(200).json({success:true,message:'Wallet created successfully'})
         }
         wallet.transactions.push(transaction)
         await wallet.save()
         return res.status(200).json({success:true,message:'wallet updated successfully'})
        }
        const transaction ={
            amount:amount/100,
            type:'credit',
            status:'success',
            razorpaymentId,
        }
        if(!wallet){
           const newWallet = new Wallet({
            user:userObjectId,
            balance:amount/100,
            transactions:[transaction]
           }) 
           await newWallet.save()
           return res.json({success:true,message:'new wallet created  successfully'})
        }
        wallet.balance+=(amount/100)
        wallet.transactions.push(transaction)
        await wallet.save()
        return res.json({success:true,message:'wallet updated successfully'})

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({success:false,message:error.message||'Internal server Error'})
    }
  }

  const loadWishlist = async (req,res)=>{
    try {
        const wishlist = await Wishlist.findOne({user:req.session.user_id}).populate('products')
        return res.render('wishlist',{wishlist})
    } catch (error) {
        console.log(error.message);
        return res.send('Internal Server Error')
    }
  }

  const addOrRemoveWishlist = async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.status(404).json({ success: false, message: 'Please login to use wishlist' });
        }

        const change = req.params.change;
        const productId = new mongoose.Types.ObjectId(req.body.productId);

        let updateOperation;
        if (change === 'add') {
            updateOperation = { $addToSet: { products: productId } };
        } else if (change === 'remove') {
            updateOperation = { $pull: { products: productId } };
        } else {
            return res.status(400).json({ success: false, message: 'Invalid change value' });
        }

        const updatedWishlist = await Wishlist.findOneAndUpdate(
            { user: req.session.user_id },
            updateOperation,
            { new: true, upsert: true }
        );
        const inWishList = change == 'add'?  true : false;

        await Products.findByIdAndUpdate(productId,{$set:{inWishList}},{new:true,upsert:true})

        const action = change === 'add' ? 'added to' : 'removed from';
        return res.json({ success: true, message: `Product ${action} wishlist`, wishlist: updatedWishlist });
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const applyCoupon = async(req,res)=>{
    try {
        
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({success:false,message:'internal server error'})
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
    verifyOtpAndChangeEmail,
    editUserEmail,
    changepassword,
    verifyOtpAndChangePassword,
    forgotSendOtp,
    fogotPassAndChangePassword,
    returnOrder,
    createOrder,
    verifyOrder,
    handledPayment,
    loadWishlist,
    addOrRemoveWishlist,
    applyCoupon
}