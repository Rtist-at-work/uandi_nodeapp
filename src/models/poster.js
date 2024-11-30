const mongoose = require('mongoose');

const posterBannerSchema = new mongoose.Schema({
    images: [String]
});

const posterSchema = mongoose.model('posterBanner',posterBannerSchema);
module.exports = posterSchema;
//lfenjlfndojv
