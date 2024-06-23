const multer = require('multer');
const path = require('path');

// Category storage engine
const categoryStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/categories/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Product storage engine
const productStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/products/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const uploadCategory = multer({
    storage: categoryStorage,
    limits: { fileSize: 5 * 1024 * 1024 } // limit files to 5MB size
}).single('mainImage'); // Expect a single file with the field name 'mainImage'
 
const uploadProduct = multer({ 
    storage: productStorage,
    limits: { fileSize: 5 * 1024 * 1024 } // limit files to 5MB size
}).fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'subImages', maxCount: 5 } // we can only allow up to 5 sub-images
]);

module.exports = {
    uploadCategory,
    uploadProduct
};
