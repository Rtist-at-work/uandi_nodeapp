const mongoose = require('mongoose');

const ageBannerSchema = new mongoose.Schema({
    images: [String],
    age: [{
        type: String,
        required: true
    }]
});
const agebannerSchema = mongoose.model('Agebanner', ageBannerSchema);
module.exports = agebannerSchema;
//lfenjlfndojv