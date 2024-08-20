const Category = require('../model/category_schema')
const { loadAddproduct } = require('./product_controller')



const loadCategory = async function (req,res){
      
        const categories = await Category.find()
        if(!categories){
        return    res.status(404).send('categories not found')
          }
    try { 
          //   render category page
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

        // delete existing files
        try {
            if(req.files.length>0){
            existingProduct.product_images.forEach((image)=>{
                const oldImagePath = path.join(__dirname, '../public/imgs/categories/', image)
                fs.unlinkSync(oldImagePath)
                console.log('successfully deleted file');
                
            })
        }
        } catch (error) {
            return res.status(404).send('file unlink error')
        }
   
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


module.exports={
    loadCategory,
    addCategory,
    LoadeditCategory,
    unlistCategory,
    updateCategory,
    relistCategory,
    LoadAddCategory
}