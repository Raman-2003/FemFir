const express = require('express');
const router = express.Router();

const {
    adminHome,
    adminLogin,
    doadminLogin,
    doadminLogout,
    adminSignup,
    doadminsignup
} = require('../controllers/adminCtrl');

router.get('/', adminHome);
router.get('/adminlogin', adminLogin);
router.post('/adminlogin', doadminLogin);

router.get('/signup', adminSignup);
router.post('/signup', doadminsignup);

router.get('/logout', doadminLogout);

module.exports = router;
