const mongoose = require('mongoose');
const { Schema } = mongoose;

const TokenSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    status: {
        type: String, 
        enum: [ "active", "deleted" ],
        default: "active",
        required: true
    }
})

module.exports = mongoose.model('tokens', TokenSchema);