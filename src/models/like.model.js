const mongoose = require('mongoose');
const { Schema } = mongoose;

const LikeSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "users"
    },
    blog: {
        type: Schema.Types.ObjectId,
        ref: "forum-blogs"
    },
    time: {
        type: Number
    }
})

module.exports = mongoose.model('likes', LikeSchema);