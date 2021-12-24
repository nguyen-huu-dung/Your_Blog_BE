const mongoose = require('mongoose');
const { Schema } = mongoose;

const AccountSchema = new Schema({
    username: {
        type: String,
        minlength: 4,
        maxlength: 200,
        required: true
    },
    password: {
        type: String,
        min: 8,
        max: 200,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: "user",
        required: true
    }
})

module.exports = mongoose.model('accounts', AccountSchema);