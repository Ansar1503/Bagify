const salesReport = async(req,res)=>{
    try {
        return res.render('salesReport')
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error')
    }
}

module.exports = {
    salesReport
}