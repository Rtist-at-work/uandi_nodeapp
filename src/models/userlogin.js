const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, sparse: true }, // `sparse: true` allows either email or mobile to be unique.
    mobile: { type: String, unique: true, sparse: true }, // Mobile field added.
    password: { type: String, required: true },
});

// Ensuring that either email or mobile is provided
userSchema.path('email').validate(function (value) {
    return value || this.mobile;
}, 'Either email or mobile number must be provided.');

userSchema.path('mobile').validate(function (value) {
    return value || this.email;
}, 'Either email or mobile number must be provided.');

const User = mongoose.model("User", userSchema);
module.exports = User;
//lfenjlfndojv
