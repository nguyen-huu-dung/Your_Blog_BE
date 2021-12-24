const mongoose = require('mongoose');
const { Schema } = mongoose;

const FriendSchema = new Schema({
    users: [{
        type: Schema.Types.ObjectId,
        ref: "users"
    }],
    created: {
        type: Number,
        required: true
    }
})

module.exports = mongoose.model('friends', FriendSchema);