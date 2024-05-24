const isLogin = async(req,res) => {
    try{
        if(!req.session.admin){
            res.redirect('/admin/adminlogin');
        }
        else next();
    }
    catch(error){
        console.log(error)
    }
}

const isLogout = async(req,res) => {
    try{
        if(!req.session.admin){
            res.redirect('/admin/products')
        }
        else next()
    }
    catch(error){
        console.log(error);
    }
}


module.exports = {
    isLogin,
    isLogout
}