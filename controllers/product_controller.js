const path =require('path')
const Products = require('../model/product_schema')
const fs = require('fs')
const Category = require('../model/category_schema')



const loadProducts = async function (req,res){
    try {
      const products = await Products.find().populate('product_category')
       return res.render('products',{products})
    } catch (error) {
        console.log(error);
        res.status(500).send("server error")
    }
}
const loadAddproduct=async function(req,res){
    try {
        const categories = await Category.find()
        
        res.render('add_product',{categories})
    } catch (error) {
        console.log(error);
        res.status(500).send("server error")
    }
}
const addProduct = async function(req,res){
    try {        
        const product_images = req.files ? req.files.map(images => images.filename) : null
        if(!product_images){
            return res.status(404).send("files not found")
        }
        const products =  new Products({
            product_name: req.body.pro_name,
            product_sale_price: req.body.pro_sale_price, 
            product_regular_price: req.body.pro_reg_price,
            product_category: req.body.pro_category,
            product_description: req.body.pro_description,
            product_quantity: req.body.pro_quantity,
            product_images,
            // product_color:req.body.pro_colors,
            product_brand:req.body.pro_brand,
        })
        // console.log(req.body);
        
        await products.save()
        if(products){
           return res.redirect('/admin/products')
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("server error")
    }
}
const loadEditProduct = async function(req,res){
    try {
        const categories = await Category.find()
        const product = await Products.findOne({_id:req.params.id}).populate('product_category')
        // console.log(product);
     
        if(product){
            return res.render('edit-product',{product,categories})
        }else{
            res.redirect('/admin/products')
        }
    } catch (error) {
        console.log(error.message);
       res.status(500).send('edit product page loading error') 
    }
}
const  editProduct = async function(req,res){
    try {
        // existig products
        const existingProduct = await Products.findById(req.body.id);
        
        // console.log(existingProduct);
        
        const product_images = req.files.length > 0 ? req.files.map(file => file.filename) : existingProduct.product_images;
        // console.log(req.body);
        // console.log(req.files);
        
    
        const updatedProduct = await Products.findByIdAndUpdate(req.body.id, {
            $set: {
                product_name: req.body.pro_name || existingProduct.product_name,
                product_sale_price: req.body.pro_sale_price || existingProduct.product_sale_price,
                product_regular_price: req.body.pro_reg_price || existingProduct.product_regular_price,
                product_category: req.body.pro_category || existingProduct.product_category,
                product_description: req.body.pro_description || existingProduct.product_description,
                product_quantity: req.body.pro_quantity || existingProduct.product_quantity,
                product_images,
                // product_color:req.body.pro_colors || existingProduct.product_color,
                product_brand:req.body.pro_brand   || existingProduct.product_brand
            }
        });
       
    if (!updatedProduct) {
        return res.status(404).send("Product update failed!");
    }
    

    try {
        if(req.files.length>0){
        existingProduct.product_images.forEach((image)=>{
            const oldImagePath = path.join(__dirname, '../public/imgs/products/', image)
            fs.unlinkSync(oldImagePath)
            console.log('successfully deleted file');
            
        })
    }
    } catch (error) {
        return res.status(404).send('file unlink error')
    }

    return res.redirect('/admin/products');


    } catch (error) {
        console.log(error.message);
        res.status(500).send('edit product error')
    }
}

const deactivateProduct = async function(req,res){
    try { 
        await Products.findByIdAndUpdate(req.params.id,{$set:{isActive:false}})
        
        return res.redirect('/admin/products')

    } catch (error) {
        res.status(500).send('could not deactivate product')
    }
}

const activateProduct = async function(req,res){
    try {       
        await Products.findByIdAndUpdate(req.params.id,{$set:{isActive:true}})
        
        return res.redirect('/admin/products')

    } catch (error) {
        res.status(500).send('couldnot activate account')
    }
}

const productdetail = async(req,res)=>{
    try {
        const product = await Products.findById(req.params.id).populate('product_category')
        return res.render('productDetails',{product})
    } catch (error) {
        console.log(error.message);
        return  res.satus(500).send('product details page loaded error')
    }
}

const addProductOfferPage = async(req,res)=>{
    try {
        return res.render('addProductOfferpage',{productId:req.params.id})
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error')        
    }
}

const addProductOffer = async(req,res)=>{
    try {
        const { name,discountPercentage,startDate,expiryDate,description } = req.body
        const product = await Products.findById(req.params.id)
       
        if(product.offer){
            return res.status(400).render('addOfferPage',{error:'offer already exists for this product check product page'})
        }
        const discountAmount = Math.ceil( product.product_sale_price * discountPercentage/100 ) 
        
        const offer = {
            name,
            discountPercentage,
            startDate,
            expiryDate,
            description,
            discountAmount
        }

        product.offer = offer
        product.offerType = 'product'
        product.offerPrice = product.product_sale_price - discountAmount
        await product.save()
        return res.redirect(`/admin/products/productdetail/${product._id}`)        
        
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error')
    }
}

const editProductOfferPage = async(req,res)=>{
    try {
        const product = await Products.findById(req.params.id)
        return res.render('editProductOfferPage',{offer:product.offer,productId:product._id})
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error')        
    }
} 

const removeProductOffer  = async(req,res)=>{
    try {
        const product = await Products.findById(req.params.id)
        if(!product || !product.offer){
          return res.satus(400).json({success:false,message:'product/offer not found'})  
        }
        product.offer = null,
        product.offerPrice = null
        await product.save()
        return res.status(200).json({success:true,message:'prodcut offer removed successfully'})
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({success:false,message:'Internal server Error'})        
    }
}

const changeOfferStatus = async(req,res)=>{
    try {
        
        const product = await Products.findById(req.params.id).populate('product_category')
        const status = req.body.status
        
        if(!product || !product.offer){
            return res.status(400).json({success:false,message:'product/offer not found'})
        }
        if(product.offer.status == status){
            return res.status(400).json({success:false,message:'same status'})
        }
        if(!status && !(product.product_category?.offer?.status)){
            product.offerType = 'none'
        }
        product.offer.status = status
        await product.save()
        const update = status == 'true' ? 'Activated' : 'Deactivated'
        return res.status(200).json({success:true,message:`offer ${update} successfully`})

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({success:false,message:'Internal Server Error'})
    }
}

const updateOfferPrice = async(req,res)=>{
    try {
        
        const offerType = req.body.offerType
        const product = await Products.findById(req.params.id).populate('product_category')
        if(!product || !product.offer || !product.product_category.offer){
            return res.status(400).json({success:false,message:'product/offer not found'})
        }
        if(offerType == 'category'){
            product.offerPrice = product.product_sale_price - Math.ceil(product.product_sale_price * product.product_category.offer.discountPercentage/100)
            product.offerType = 'category'
        }
        if(offerType == 'product'){
            product.offerPrice = product.product_sale_price - Math.ceil(product.product_sale_price * product.offer.discountPercentage/100)
            product.offerType = 'product'
        }
        await product.save()
        return res.status(200).json({success:true,message:'offer price updated successfully'})
       
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({success:false,message:'Internal Server Error'})        
    }
}

module.exports = {
    loadProducts,
    loadAddproduct,
    addProduct,
    loadEditProduct,
    editProduct,
    deactivateProduct,
    activateProduct,
    productdetail,
    addProductOfferPage,
    addProductOffer,
    editProductOfferPage,
    removeProductOffer,
    changeOfferStatus,
    updateOfferPrice
}