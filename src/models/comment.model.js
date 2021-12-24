const mongoose = require('mongoose');
const { Schema } = mongoose;

const CommentSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "users"
    },
    blog: {
        type: Schema.Types.ObjectId,
        ref: "forum-blogs"
    },
    content: {
        type: String,
        required: true
    },
    created: {
        type: Number,
        required: true
    },
    updated: {
        type: Number,
        default: null
    }
})

module.exports = mongoose.model('comments', CommentSchema);
