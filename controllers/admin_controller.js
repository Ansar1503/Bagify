const Admin = require('../model/admin_schema')



const loadlogin = async function(req,res){
    try {
        res.render('login')
    } catch (error) {
        console.log(error);
        res.status(500).send("server error")
    }
}


const loadadminDashboard = async function (req,res){
    try {
        res.render('admin_Dashboard')
    } catch (error) {
        console.log(error);
        res.status(500).send("server error")
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
}