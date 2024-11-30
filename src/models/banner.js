const mongoose = require('mongoose');

const mainBannerSchema = new mongoose.Schema({
    images: [[String]]
});

const bannersSchema = mongoose.model('Banner', mainBannerSchema);
module.exports = bannersSchema;
//lfenjlfndojv
