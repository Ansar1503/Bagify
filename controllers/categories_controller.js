const Category = require('../model/category_schema')
const Products = require('../model/product_schema')


const loadCategory = async function (req,res){
      
        const categories = await Category.find()
        if(!categories){
        return    res.status(404).send('categories not found')
          }
    try { 
        
        return res.render('categories',{categories})
          
    } catch (error) {
        res.status(500).send('category page error')
    }
}
const LoadAddCategory = async(req,res)=>{
    try {
        return res.render('add-category')
    } catch (error) {
      return res.status(500).send('add category page loaded error')
    }
}
 
const addCategory = async function (req,res){
    try {

        const add_category = new Category({
            name:req.body.name,
            image:req.file.filename
            }) 
        await add_category.save()  

        return res.redirect('/admin/category')

    } catch (error) {
        console.log(error.message);
       return res.status(500).send('category page loadded error')
    }
}
const unlistCategory = async function(req,res){
        const unlist = await Category.findByIdAndUpdate(req.params.id,{$set:{isListed:false}})
        if(!unlist){
        return  res.status(404).send('unlit category erorr')
        }
    try {
        res.redirect('/admin/category/')
    } catch (error) {
        res.status(500).send('category page load error')
    }
}
const relistCategory = async (req,res)=>{
    const relist = await Category.findByIdAndUpdate(req.params.id,{$set:{isListed:true}})
    if(!relist){
        return res.status(404).send('relist category error')
    }
    try {
        res.redirect('/admin/category')
    } catch (error) {
        res.status(500).send('category page load error')
    }
}

const LoadeditCategory = async function(req,res){
     const category=await Category.findOne({_id:req.params.id})
     if(!category){
        return res.status(404).send('category not found')
    }
    try {
        return res.render('edit-category',{category})
    } catch (error) {
        console.log(error.message);
       return res.status(500).send('edit category page load error')
      
    }
}

const updateCategory = async function (req,res){
    try {
        const existingCategory = await Category.findById(req.params.id)
        const updateCategory = await Category.findByIdAndUpdate(req.params.id,{$set:{name:req.body.name,image:req.file?req.file.filename:existingCategory.image}})
        if(!updateCategory){
            return res.status(404).send('update category error')
        }
        return res.redirect('/admin/category/')
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('updating category error')
    }
}
const loadCategoryDetails = async(req,res)=>{
    try{
        const category = await Category.findOne({_id:req.params.id})
        console.log(category);
        return res.render('categoryDetails',{category})
    }catch(error){
        console.log(error.message);
        return res.status(500).send('Internal Server')
    }
}

const loadAddCategoryPage = async(req,res)=>{
    try{
        return res.render('addCategoryOffer',{categoryId:req.params.id})
    }catch(error){
        console.log(error.message)
        return res.status(500).send('Internal Server Error')  
    }
}

const addCategoryOffer = async(req,res)=>{
    try{
        const { name,discountPercentage,startDate,expiryDate,description } = req.body
        const category = await Category.findById(req.params.id)
        if(!category || !category.isListed ){
            return res.status(400).send('category not found')
        }
        if(category.offer || category.offer?.name == name){
            return res.status(400).send('offer already added')
        }
        const offer = {
            name,
            discountPercentage,
            startDate,
            expiryDate,
            description
        }
        const products = await Products.find({product_category:req.params.id}).populate('product_category')
        if(!products || products.lenth==0){
            console.log('no products found');
        }

        for (const product of products) {
            product.offerPrice = product.product_sale_price - Math.ceil(product.product_sale_price * discountPercentage / 100);
            product.offerType = 'category'
            await product.save();
        }
        
        category.offer = offer
        await category.save()
        return res.status(200).redirect(`/admin/category/details/${req.params.id}`)

    }catch(error){
        console.log(error.message)
        return res.status(500).send('Internal Server Error')
    }
}

const loadEditCategoryOfferPage  = async(req,res)=>{
    try {
        const category = await Category.findById(req.params.id)
        return res.render('editCategoryOfferPage',{category})
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error')        
    }
}

const removeCategoryOffer = async(req,res)=>{
    try {
        const category  = await Category.findById(req.params.id)
        if(!category || !category.offer){
            return res.status(400).json({success:false,message:'category/offer not found'})
        }
        
        const products = await Products.find({product_category:req.params.id}).populate('product_category')
        if(!products || products.lenth==0){
            console.log('no products found');
        }
       
        category.offer = null
        await category.save()

        for (const product of products) {
            if(product.offer){
                product.offerPrice = product.product_sale_price - Math.ceil(product.product_sale_price * product.offer.discountPercentage / 100);
                product.offerType = 'product'
            }else if(!product.offer){
                product.offerPrice = null
                product.offerType = 'none'
            }
            await product.save();
        }

        return res.status(200).json({success:true,message:'offer removed successfully'})
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({success:false,message:'Internal server Error'})
    }
}

const changeOfferStatus = async(req,res)=>{
    try {
        const category = await Category.findById(req.params.id)
        const status = req.body.status

        if(!category || !category.offer){
            return res.status(400).json({success:false,message:'category/offer not found'})
        }

        if(category.offer.status == status){
            return res.status(400).json({success:false,message:'same status'})
        }
        const products = await Products.find({product_category:req.params.id}).populate('product_category')
        if(!products || products.lenth==0){
            console.log('products not found');
        }
        
        for(const product of products){
            if(!status && !product.offer?.status){
                product.offerType = 'none'
            }
            await product.save()
        }

        category.offer.status = status
        await category.save()
        const change = status ? 'Activated' : 'Deactivated'
        return res.status(200).json({success:true,message:`offer ${change} changed successfully`})

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({success:false,message:'Internal server Error'})
    }
}

module.exports={
    loadCategory,
    addCategory,
    LoadeditCategory,
    unlistCategory,
    updateCategory,
    relistCategory,
    LoadAddCategory,
    loadCategoryDetails,
    loadAddCategoryPage,
    addCategoryOffer,
    loadEditCategoryOfferPage,
    removeCategoryOffer,
    changeOfferStatus
}