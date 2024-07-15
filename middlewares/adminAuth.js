const isLogin = async (req, res, next) => {
    try {
        if (!req.session.admin) {
            return res.redirect('/admin/adminlogin'); // Ensure redirection stops further processing
        }
        next(); // Call the next middleware or route handler
    } catch (error) {
        console.log(error);
    }
};

const isLogout = async (req, res, next) => {
    try {
        if (req.session.admin) { // Ensure we check if session admin exists to redirect to products
            return res.redirect('/admin/products'); // Ensure redirection stops further processing
        }
        next(); // Call the next middleware or route handler
    } catch (error) {
        console.log(error);
    }
}; 

module.exports = {
    isLogin,
    isLogout
};
