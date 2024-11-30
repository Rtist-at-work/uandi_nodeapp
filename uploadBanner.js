const multer = require('multer');
const path = require('path');

const app = express();

const storage = multer.diskStorage({
    destination : function (req,file,cb){
        cb(null,'./Assets/productImages')
    },
    filename : function(req,file,cb){
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random()*1E9);
        cb(null,file.fieldname+'-'+uniqueSuffix+path.extname(file.originalname));
    }
});

const uploadBanner = multer({
    storage : storage,
    fileFilter : (req,file,cb)=>{
        const fileType = /jpeg|jpg|png|webp/;
        const mimeType = fileType.test(file.mimetype);
        const extname = fileType.test(path.extname(file.originalname).toLowerCase());
        if (mimeType && extname){
            return callback(null, true);
        }
        callback('Give proper file format to upload',false);

    },
    limits: {
        fileSize: 1024 * 1024 * 5 
    }
})
//lfenjlfndojv

module.exports = uploadBanner